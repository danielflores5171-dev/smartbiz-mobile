// src/reports/insightEngine.ts
import type { ID } from "@/src/types/business";
import type { Product, StockAdjustment } from "@/src/types/inventory";
import type { Sale } from "@/src/types/sales";
import {
    addDays,
    aggregateSalesTotals,
    lowStockProducts,
    noMovementProducts,
    round2,
    salesSeriesByDay,
    selectSalesForBusiness,
    topProducts,
} from "./reportSelectors";

export type InsightForecast = {
  horizonDays: number;
  daily: { day: string; predictedTotal: number }[];
  predictedTotal: number;
  model: "exp_smoothing";
  alpha: number;
};

export type ReorderSuggestion = {
  productId: string;
  name: string;
  unit: string;
  stock: number;
  minStock?: number;
  avgDailyUnits: number; // ventas/día
  daysCover: number; // stock / avgDailyUnits
  severity: "critical" | "warning";
  suggestion: string;
};

export type Anomaly = {
  kind: "spike" | "drop" | "low_stock";
  title: string;
  detail: string;
  score: number; // 0..1 (heurística)
};

export type InsightSummary = {
  headline: string;
  bullets: string[];
};

export type InsightPack = {
  forecast7d: InsightForecast;
  reorder: ReorderSuggestion[];
  anomalies: Anomaly[];
  summary: InsightSummary;
};

function safeNum(n: any): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

/**
 * Exponential smoothing sobre serie diaria (totales)
 * - alpha: 0..1 (más alto = reacciona más rápido)
 */
export function forecastSalesExpSmoothing(params: {
  sales: Sale[];
  businessId: ID;
  horizonDays?: number; // default 7
  historyDays?: number; // default 28
  alpha?: number; // default 0.35
}) {
  const horizonDays = params.horizonDays ?? 7;
  const historyDays = params.historyDays ?? 28;
  const alpha = Math.min(0.9, Math.max(0.05, params.alpha ?? 0.35));

  const series = salesSeriesByDay({
    sales: params.sales,
    businessId: params.businessId,
    days: historyDays,
  });

  const values = series.points.map((p) => safeNum(p.total));
  // seed: promedio
  const seed =
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  let level = seed;
  for (const y of values) {
    level = alpha * y + (1 - alpha) * level;
  }

  // predicción plana para los próximos N días (nivel final)
  const daily: { day: string; predictedTotal: number }[] = [];
  const start = addDays(new Date(series.to), 1);
  for (let i = 0; i < horizonDays; i++) {
    const day = addDays(start, i);
    const k = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate(),
    ).padStart(2, "0")}`;
    daily.push({ day: k, predictedTotal: round2(level) });
  }

  const predictedTotal = round2(
    daily.reduce((acc, d) => acc + d.predictedTotal, 0),
  );

  return {
    horizonDays,
    daily,
    predictedTotal,
    model: "exp_smoothing" as const,
    alpha,
  };
}

/**
 * Recomendaciones de reabasto (sin IA externa):
 * - Calcula avgDailyUnits en últimos N días usando ventas
 * - daysCover = stock / avgDailyUnits
 * - si stock <= minStock => critical
 * - si daysCover < X => warning
 */
export function buildReorderSuggestions(params: {
  products: Product[];
  sales: Sale[];
  businessId: ID;
  lookbackDays?: number; // default 14
  warnDaysCover?: number; // default 7
}) {
  const lookbackDays = params.lookbackDays ?? 14;
  const warnDaysCover = params.warnDaysCover ?? 7;

  const cutoff = addDays(new Date(), -Math.max(1, lookbackDays));
  const sales = params.sales.filter(
    (s) =>
      s.businessId === params.businessId && new Date(s.createdAt) >= cutoff,
  );

  // units sold per product
  const sold = new Map<string, number>();
  for (const s of sales) {
    for (const it of s.items ?? []) {
      sold.set(
        it.productId,
        round2((sold.get(it.productId) ?? 0) + safeNum(it.qty)),
      );
    }
  }

  const prod = params.products.filter(
    (p) => p.businessId === params.businessId,
  );

  const out: ReorderSuggestion[] = [];

  for (const p of prod) {
    const units = sold.get(p.id) ?? 0;
    const avgDailyUnits = round2(units / lookbackDays);
    const daysCover =
      avgDailyUnits > 0
        ? round2(p.stock / avgDailyUnits)
        : Number.POSITIVE_INFINITY;

    const isLow = p.minStock != null && p.stock <= (p.minStock ?? 0);
    const isWarn = !isLow && avgDailyUnits > 0 && daysCover <= warnDaysCover;

    if (!isLow && !isWarn) continue;

    const severity: ReorderSuggestion["severity"] = isLow
      ? "critical"
      : "warning";

    const suggestion =
      severity === "critical"
        ? `Stock bajo (≤ mínimo). Reabastecer pronto.`
        : `A este ritmo, se agota en ~${daysCover} días. Considera reabasto.`;

    out.push({
      productId: p.id,
      name: p.name,
      unit: p.unit,
      stock: p.stock,
      minStock: p.minStock,
      avgDailyUnits,
      daysCover,
      severity,
      suggestion,
    });
  }

  // critical primero, luego por menor cobertura
  out.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    return a.daysCover - b.daysCover;
  });

  return out.slice(0, 12);
}

/** Anomalías simples: spike/drop vs promedio 14 días + low_stock */
export function detectAnomalies(params: {
  sales: Sale[];
  products: Product[];
  businessId: ID;
}) {
  const series = salesSeriesByDay({
    sales: params.sales,
    businessId: params.businessId,
    days: 14,
  });

  const values = series.points.map((p) => safeNum(p.total));
  const avg =
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  const today = series.points[series.points.length - 1]?.total ?? 0;

  const anomalies: Anomaly[] = [];

  if (avg > 0) {
    const ratio = today / avg;
    if (ratio >= 2.0) {
      anomalies.push({
        kind: "spike",
        title: "Pico de ventas hoy",
        detail: `Hoy vendiste ${round2(ratio)}× tu promedio de los últimos 14 días.`,
        score: Math.min(1, (ratio - 1) / 2),
      });
    } else if (ratio <= 0.35) {
      anomalies.push({
        kind: "drop",
        title: "Ventas bajas hoy",
        detail: `Hoy vendiste ${round2(ratio)}× tu promedio de los últimos 14 días.`,
        score: Math.min(1, 1 - ratio),
      });
    }
  }

  const low = lowStockProducts(params.products, params.businessId);
  if (low.length > 0) {
    anomalies.push({
      kind: "low_stock",
      title: "Productos con bajo stock",
      detail: `Tienes ${low.length} producto(s) en o por debajo del stock mínimo.`,
      score: Math.min(1, low.length / 10),
    });
  }

  // score desc
  anomalies.sort((a, b) => b.score - a.score);
  return anomalies.slice(0, 6);
}

/** Resumen “tipo IA” (narrativo) basado en datos */
export function buildNarrativeSummary(params: {
  sales: Sale[];
  products: Product[];
  adjustments?: StockAdjustment[];
  businessId: ID;
}) {
  const last7 = selectSalesForBusiness(params.sales, params.businessId, {
    from: addDays(new Date(), -6),
    to: new Date(),
  });
  const totals7 = aggregateSalesTotals(last7);

  const top = topProducts({
    sales: params.sales,
    businessId: params.businessId,
    range: { from: addDays(new Date(), -29), to: new Date() },
    limit: 3,
  });

  const low = lowStockProducts(params.products, params.businessId).slice(0, 3);
  const noMove = noMovementProducts({
    products: params.products,
    businessId: params.businessId,
    days: 21,
    adjustments: params.adjustments,
    sales: params.sales,
  }).slice(0, 3);

  const bullets: string[] = [];

  bullets.push(
    `Últimos 7 días: ${totals7.count} venta(s), total $${totals7.total.toFixed(2)}.`,
  );

  if (top.length > 0) {
    bullets.push(
      `Top productos (30 días): ${top
        .map((t) => `${t.name} ($${t.revenue.toFixed(2)})`)
        .join(", ")}.`,
    );
  } else {
    bullets.push(`Top productos (30 días): aún no hay datos suficientes.`);
  }

  if (low.length > 0) {
    bullets.push(
      `Bajo stock: ${low
        .map(
          (p) =>
            `${p.name} (stock ${p.stock}${p.minStock != null ? ` / min ${p.minStock}` : ""})`,
        )
        .join(", ")}.`,
    );
  } else {
    bullets.push(`Bajo stock: todo en orden ✅`);
  }

  if (noMove.length > 0) {
    bullets.push(
      `Sin movimiento (21 días): ${noMove.map((p) => p.name).join(", ")}.`,
    );
  }

  const headline =
    totals7.total > 0
      ? `Resumen: $${totals7.total.toFixed(2)} en los últimos 7 días`
      : `Resumen: aún no hay ventas registradas`;

  return { headline, bullets };
}

/** Pack completo para UI (reportes y dashboard) */
export function buildInsightsPack(params: {
  sales: Sale[];
  products: Product[];
  adjustments?: StockAdjustment[];
  businessId: ID;
}) {
  const forecast7d = forecastSalesExpSmoothing({
    sales: params.sales,
    businessId: params.businessId,
    horizonDays: 7,
    historyDays: 28,
    alpha: 0.35,
  });

  const reorder = buildReorderSuggestions({
    products: params.products,
    sales: params.sales,
    businessId: params.businessId,
    lookbackDays: 14,
    warnDaysCover: 7,
  });

  const anomalies = detectAnomalies({
    sales: params.sales,
    products: params.products,
    businessId: params.businessId,
  });

  const summary = buildNarrativeSummary({
    sales: params.sales,
    products: params.products,
    adjustments: params.adjustments,
    businessId: params.businessId,
  });

  return { forecast7d, reorder, anomalies, summary } satisfies InsightPack;
}
