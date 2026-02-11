// src/reports/reportSelectors.ts
import type { ID } from "@/src/types/business";
import type { Product, StockAdjustment } from "@/src/types/inventory";
import type { Sale } from "@/src/types/sales";

export type DateRange = { from: Date; to: Date };

export function clampRange(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  if (from > to) return { from: to, to: from };
  return { from, to };
}

export function inRange(iso: string, range: DateRange): boolean {
  const d = new Date(iso).getTime();
  return d >= range.from.getTime() && d <= range.to.getTime();
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function toDayKey(d: Date): string {
  // YYYY-MM-DD (local)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function safeNum(n: any): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Filtra ventas por negocio y rango (inclusive) */
export function selectSalesForBusiness(
  sales: Sale[],
  businessId: ID,
  range?: DateRange,
): Sale[] {
  const base = sales.filter((s) => s.businessId === businessId);
  if (!range) return base;
  const r = clampRange(range);
  return base.filter((s) => inRange(s.createdAt, r));
}

/** Totales agregados (ventas) */
export function aggregateSalesTotals(sales: Sale[]) {
  const subtotal = round2(
    sales.reduce((acc, s) => acc + safeNum(s.subtotal), 0),
  );
  const discount = round2(
    sales.reduce((acc, s) => acc + safeNum(s.discount), 0),
  );
  const taxableBase = round2(
    sales.reduce((acc, s) => acc + safeNum(s.taxableBase), 0),
  );
  const taxAmount = round2(
    sales.reduce((acc, s) => acc + safeNum(s.taxAmount), 0),
  );
  const total = round2(sales.reduce((acc, s) => acc + safeNum(s.total), 0));

  return {
    subtotal,
    discount,
    taxableBase,
    taxAmount,
    total,
    count: sales.length,
  };
}

/**
 * Serie por día (últimos N días o por rango)
 * Devuelve días contiguos incluyendo días con 0.
 */
export function salesSeriesByDay(params: {
  sales: Sale[];
  businessId: ID;
  days?: number; // si no hay range, usa últimos N días (default 14)
  range?: DateRange;
}) {
  const { sales, businessId } = params;
  const days = params.days ?? 14;

  let from: Date;
  let to: Date;

  if (params.range) {
    const r = clampRange(params.range);
    from = startOfDay(r.from);
    to = startOfDay(r.to);
  } else {
    to = startOfDay(new Date());
    from = startOfDay(addDays(to, -(days - 1)));
  }

  const inBiz = selectSalesForBusiness(sales, businessId, { from, to });

  // map dayKey -> totals
  const map = new Map<string, { total: number; count: number }>();
  for (const s of inBiz) {
    const k = toDayKey(startOfDay(new Date(s.createdAt)));
    const prev = map.get(k) ?? { total: 0, count: 0 };
    map.set(k, {
      total: round2(prev.total + safeNum(s.total)),
      count: prev.count + 1,
    });
  }

  // build contiguous list
  const out: { day: string; total: number; count: number }[] = [];
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    const k = toDayKey(d);
    const v = map.get(k) ?? { total: 0, count: 0 };
    out.push({ day: k, total: v.total, count: v.count });
  }

  return { from, to, points: out };
}

/** Top productos por ventas (monto y unidades) */
export function topProducts(params: {
  sales: Sale[];
  businessId: ID;
  range?: DateRange;
  limit?: number;
}) {
  const { sales, businessId } = params;
  const limit = params.limit ?? 10;

  const base = selectSalesForBusiness(sales, businessId, params.range);

  type Agg = {
    productId: string;
    name: string;
    unit: string;
    qty: number;
    revenue: number;
  };

  const map = new Map<string, Agg>();

  for (const s of base) {
    for (const it of s.items ?? []) {
      const key = it.productId;
      const prev =
        map.get(key) ??
        ({
          productId: it.productId,
          name: it.name,
          unit: it.unit,
          qty: 0,
          revenue: 0,
        } as Agg);

      const qty = safeNum(it.qty);
      const line = round2(qty * safeNum(it.price));
      map.set(key, {
        ...prev,
        // si el nombre cambia, nos quedamos con el más reciente
        name: it.name ?? prev.name,
        unit: (it.unit as any) ?? prev.unit,
        qty: round2(prev.qty + qty),
        revenue: round2(prev.revenue + line),
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Inventario: bajo stock */
export function lowStockProducts(products: Product[], businessId: ID) {
  return products
    .filter((p) => p.businessId === businessId)
    .filter((p) => p.minStock != null && p.stock <= (p.minStock ?? 0))
    .sort(
      (a, b) => a.stock - (a.minStock ?? 0) - (b.stock - (b.minStock ?? 0)),
    );
}

/**
 * Inventario: sin movimiento en N días (usa adjustments si existen; si no, usa ventas como fallback)
 * - Preferencia: adjustments (porque también incluye compras/ajustes)
 */
export function noMovementProducts(params: {
  products: Product[];
  businessId: ID;
  days: number;
  adjustments?: StockAdjustment[];
  sales?: Sale[];
}) {
  const { products, businessId, days } = params;
  const cutoff = addDays(new Date(), -Math.max(1, days));

  const prod = products.filter((p) => p.businessId === businessId);

  const moved = new Set<string>();

  if (params.adjustments && params.adjustments.length > 0) {
    for (const a of params.adjustments) {
      if (a.businessId !== businessId) continue;
      if (new Date(a.createdAt) >= cutoff) moved.add(a.productId);
    }
  } else if (params.sales) {
    // fallback: ventas
    for (const s of params.sales) {
      if (s.businessId !== businessId) continue;
      if (new Date(s.createdAt) < cutoff) continue;
      for (const it of s.items ?? []) moved.add(it.productId);
    }
  }

  return prod.filter((p) => !moved.has(p.id));
}

/** Serie por método de pago */
export function paymentMethodBreakdown(sales: Sale[]) {
  const out: Record<string, { count: number; total: number }> = {};
  for (const s of sales) {
    const k = String(s.paymentMethod ?? "unknown");
    out[k] = out[k] ?? { count: 0, total: 0 };
    out[k].count += 1;
    out[k].total = round2(out[k].total + safeNum(s.total));
  }
  return out;
}

/** Utilidad estimada (si tienes cost en Product) = (price - cost) * qty, sobre ventas del rango */
export function estimatedProfit(params: {
  sales: Sale[];
  products: Product[];
  businessId: ID;
  range?: DateRange;
}) {
  const { sales, products, businessId } = params;
  const prodMap = new Map(products.map((p) => [p.id, p]));
  const base = selectSalesForBusiness(sales, businessId, params.range);

  let profit = 0;
  for (const s of base) {
    for (const it of s.items ?? []) {
      const p = prodMap.get(it.productId);
      const cost = safeNum(p?.cost);
      const price = safeNum(it.price);
      const qty = safeNum(it.qty);
      profit += (price - cost) * qty;
    }
  }
  return round2(profit);
}
