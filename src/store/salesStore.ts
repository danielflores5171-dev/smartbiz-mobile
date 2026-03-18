// src/store/salesStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";
import { salesService } from "../services/salesService";
import type { ID } from "../types/business";
import type { CartItem, PaymentMethod, Sale } from "../types/sales";
import { inventoryActions } from "./inventoryStore";
import { notificationActions } from "./notificationStore";

import {
  salesApi,
  type ApiSaleDetail,
  type ApiSaleDetailItem,
  type ApiSaleListItem,
} from "@/src/api/salesApi";

type State = {
  userId: string | null;

  cart: CartItem[];
  discount: number;
  salesByBusiness: Record<string, Sale[]>;

  lastSaleId: ID | null;

  loading: boolean;
  error: string | null;
  hydrated: boolean;
};

const BASE_KEY = "smartbiz.salesStore.v2";
const TAX_RATE_DEFAULT = 0.16;

function keyForUser(userId: string) {
  return `${BASE_KEY}:${userId}`;
}

const state: State = {
  userId: null,
  cart: [],
  discount: 0,
  salesByBusiness: {},
  lastSaleId: null,
  loading: false,
  error: null,
  hydrated: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function getState() {
  return state;
}

function setState(patch: Partial<State>, opts?: { skipPersist?: boolean }) {
  Object.assign(state, patch);
  emit();
  if (!opts?.skipPersist) void persist();
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let bootstrapInFlight = false;

async function persist() {
  const s = getState();
  if (!s.hydrated) return;
  if (!s.userId) return;

  if (persistTimer) clearTimeout(persistTimer);

  persistTimer = setTimeout(async () => {
    try {
      await AsyncStorage.setItem(
        keyForUser(s.userId!),
        JSON.stringify({
          cart: s.cart,
          discount: s.discount,
          salesByBusiness: s.salesByBusiness,
          lastSaleId: s.lastSaleId,
        }),
      );
    } catch {
      // silencioso
    }
  }, 150);
}

async function flush() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  const s = getState();
  if (!s.hydrated || !s.userId) return;

  try {
    await AsyncStorage.setItem(
      keyForUser(s.userId!),
      JSON.stringify({
        cart: s.cart,
        discount: s.discount,
        salesByBusiness: s.salesByBusiness,
        lastSaleId: s.lastSaleId,
      }),
    );
  } catch {
    // silencioso
  }
}

async function hydrateForUser(userId: string) {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(keyForUser(userId));
  } catch {
    raw = null;
  }

  if (!raw) {
    setState(
      {
        userId,
        cart: [],
        discount: 0,
        salesByBusiness: {},
        lastSaleId: null,
        loading: false,
        error: null,
        hydrated: true,
      },
      { skipPersist: true },
    );
    return;
  }

  try {
    const parsed = JSON.parse(raw) as any;
    setState(
      {
        userId,
        cart: parsed?.cart ?? [],
        discount: parsed?.discount ?? 0,
        salesByBusiness: parsed?.salesByBusiness ?? {},
        lastSaleId: parsed?.lastSaleId ?? null,
        loading: false,
        error: null,
        hydrated: true,
      },
      { skipPersist: true },
    );
  } catch {
    setState(
      {
        userId,
        cart: [],
        discount: 0,
        salesByBusiness: {},
        lastSaleId: null,
        loading: false,
        error: null,
        hydrated: true,
      },
      { skipPersist: true },
    );
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function toNum(v: unknown, fallback = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function normalizeTaxRate(input: unknown): number {
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0) return TAX_RATE_DEFAULT;
  if (n > 1) return round2(n / 100);
  return round2(n);
}

function computeTotals(cart: CartItem[], discount: number, taxRate: number) {
  const subtotal = round2(cart.reduce((acc, it) => acc + it.price * it.qty, 0));
  const disc = round2(Math.max(0, Math.min(discount || 0, subtotal)));
  const base = round2(Math.max(0, subtotal - disc));
  const tax = round2(base * taxRate);
  const total = round2(base + tax);
  return { subtotal, discount: disc, taxableBase: base, taxAmount: tax, total };
}

function requireUserId() {
  const uid = getState().userId;
  if (!uid) throw new Error("No hay usuario para ventas. (Falta bootstrap)");
  return uid;
}

async function tryApi<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T | null> {
  try {
    console.log(`[${label}] CALL`);
    return await fn();
  } catch (e) {
    console.log(`[${label}] FAIL -> fallback demo:`, String(e));
    return null;
  }
}

function mapApiSaleListItemToSale(it: ApiSaleListItem, businessId: ID): Sale {
  const subtotal = round2(toNum(it.subtotal));
  const discount = round2(toNum(it.discount));
  const taxAmount = round2(toNum(it.tax));
  const total = round2(toNum(it.total));
  const taxableBase = round2(Math.max(0, subtotal - discount));
  const taxRate = taxableBase > 0 ? round2(taxAmount / taxableBase) : 0.16;
  const paid = round2(
    it.cash_received == null ? total : Math.max(total, toNum(it.cash_received)),
  );
  const change = round2(toNum(it.cash_change));

  return {
    id: String(it.id),
    businessId,
    items: [],
    subtotal,
    discount,
    taxableBase,
    taxRate,
    taxAmount,
    total,
    paymentMethod: "cash",
    paid,
    change,
    createdAt: String(it.created_at ?? new Date().toISOString()),
  };
}

function mapApiDetailItemsToCartItems(items: ApiSaleDetailItem[]): CartItem[] {
  return items.map((it) => ({
    productId: String(it.product_id),
    name: String(it.name ?? "Producto"),
    unit: "PZ" as any,
    price: round2(toNum(it.unit_price)),
    qty: Math.max(1, toNum(it.qty, 1)),
  }));
}

function mergeSaleDetailIntoSale(
  summarySale: Sale | null,
  detail: ApiSaleDetail,
  items: ApiSaleDetailItem[],
  businessId: ID,
): Sale {
  const subtotal = round2(toNum(detail.subtotal));
  const discount = round2(toNum(detail.discount));
  const taxAmount = round2(toNum(detail.tax));
  const total = round2(toNum(detail.total));
  const taxableBase = round2(Math.max(0, subtotal - discount));
  const taxRate = taxableBase > 0 ? round2(taxAmount / taxableBase) : 0.16;
  const paid = round2(
    detail.cash_received == null
      ? total
      : Math.max(total, toNum(detail.cash_received)),
  );
  const change = round2(toNum(detail.cash_change));

  return {
    id: String(detail.id),
    businessId,
    items: mapApiDetailItemsToCartItems(items),
    subtotal,
    discount,
    taxableBase,
    taxRate,
    taxAmount,
    total,
    paymentMethod: "cash",
    paid,
    change,
    note: summarySale?.note,
    createdAt: String(
      detail.created_at ?? summarySale?.createdAt ?? new Date().toISOString(),
    ),
  };
}

export const salesActions = {
  async bootstrap(userId?: string) {
    console.log("[salesStore.bootstrap] userId=", userId);

    if (bootstrapInFlight) {
      console.log("[salesStore.bootstrap] skip: bootstrap en curso");
      return;
    }

    if (!userId) {
      if (!getState().hydrated) {
        setState({ hydrated: true }, { skipPersist: true });
      }
      return;
    }

    if (getState().hydrated && getState().userId === userId) {
      console.log(
        "[salesStore.bootstrap] skip: ya hidratado para este usuario",
      );
      return;
    }

    bootstrapInFlight = true;

    try {
      setState(
        {
          hydrated: false,
          loading: false,
          error: null,
          userId,
          cart: [],
          discount: 0,
          salesByBusiness: {},
          lastSaleId: null,
        },
        { skipPersist: true },
      );

      await hydrateForUser(userId);
      await flush();
    } finally {
      bootstrapInFlight = false;
    }
  },

  clearLocalMemoryOnly() {
    setState(
      {
        userId: null,
        cart: [],
        discount: 0,
        salesByBusiness: {},
        lastSaleId: null,
        loading: false,
        error: null,
        hydrated: false,
      },
      { skipPersist: true },
    );
  },

  clearLocal() {
    this.clearLocalMemoryOnly();
  },

  async loadSales(businessId: ID, token?: string | null) {
    requireUserId();
    setState({ loading: true, error: null });

    if (token) {
      const apiRes = await tryApi(
        () => salesApi.list(token, businessId),
        "salesApi.list",
      );

      const rawItems = (apiRes as any)?.data?.items as
        | ApiSaleListItem[]
        | undefined;
      if (Array.isArray(rawItems)) {
        const mapped = rawItems.map((it) =>
          mapApiSaleListItemToSale(it, businessId),
        );

        const next = {
          ...getState().salesByBusiness,
          [String(businessId)]: mapped,
        };

        setState({ salesByBusiness: next, loading: false, error: null });
        await flush();
        return;
      }
    }

    try {
      const userId = requireUserId();
      const demo = await salesService.listSales(userId, businessId);
      const next = {
        ...getState().salesByBusiness,
        [String(businessId)]: demo,
      };
      setState({ salesByBusiness: next, loading: false, error: null });
      await flush();
    } catch (e: any) {
      setState({
        loading: false,
        error: e?.message ?? "Error cargando ventas",
      });
    }
  },

  async deleteSale(businessId: ID, id: ID, token?: string | null) {
    const userId = getState().userId;

    const current = getState().salesByBusiness[String(businessId)] ?? [];
    const nextList = current.filter((s) => s.id !== id);

    setState({
      salesByBusiness: {
        ...getState().salesByBusiness,
        [String(businessId)]: nextList,
      },
    });
    await flush();

    if (token) {
      const ok = await tryApi(
        () => salesApi.remove(token, businessId, id),
        "salesApi.remove",
      );
      if (ok) return;
    }

    if (userId) {
      void salesService.deleteSale(userId, businessId, id).catch(() => {});
    }
  },

  addToCart(item: Omit<CartItem, "qty">) {
    const cart = getState().cart.slice();
    const idx = cart.findIndex((c) => c.productId === item.productId);

    if (idx >= 0) {
      cart[idx] = { ...cart[idx], qty: cart[idx].qty + 1 };
    } else {
      cart.unshift({ ...item, qty: 1 });
    }

    setState({ cart });
  },

  removeFromCart(productId: ID) {
    setState({
      cart: getState().cart.filter((c) => c.productId !== productId),
    });
  },

  inc(productId: ID) {
    setState({
      cart: getState().cart.map((c) =>
        c.productId === productId ? { ...c, qty: c.qty + 1 } : c,
      ),
    });
  },

  dec(productId: ID) {
    setState({
      cart: getState()
        .cart.map((c) =>
          c.productId === productId ? { ...c, qty: Math.max(1, c.qty - 1) } : c,
        )
        .filter((c) => c.qty > 0),
    });
  },

  clearCart() {
    setState({ cart: [], discount: 0 });
  },

  setDiscount(value: number) {
    setState({ discount: Math.max(0, value || 0) });
  },

  async checkout(
    params: {
      businessId: ID;
      paymentMethod: PaymentMethod;
      paid: number;
      note?: string;
      taxRate?: number;
    },
    token?: string | null,
  ) {
    const userId = requireUserId();

    const s = getState();
    const cart = s.cart;
    if (cart.length === 0) throw new Error("El carrito está vacío");

    const taxRate = normalizeTaxRate(params.taxRate ?? TAX_RATE_DEFAULT);
    const totals = computeTotals(cart, s.discount, taxRate);

    const paid = round2(Math.max(0, params.paid || 0));
    const change = round2(Math.max(0, paid - totals.total));

    const saleInput: Omit<Sale, "id" | "createdAt"> = {
      businessId: params.businessId,
      items: cart,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxableBase: totals.taxableBase,
      taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      paymentMethod: params.paymentMethod,
      paid,
      change,
      note: params.note?.trim() || undefined,
    };

    setState({ loading: true, error: null });

    try {
      for (const it of cart) {
        await inventoryActions.adjustStock(
          {
            productId: it.productId as any,
            delta: -Math.abs(it.qty),
            reason: "Venta",
            note: `Venta (pendiente de id)`,
          },
          token ?? undefined,
        );
      }
    } catch {
      // ignora si el backend aún no deja
    }

    try {
      if (token) {
        const apiBody = {
          discount: totals.discount,
          tax_pct: Math.round(taxRate * 100),
          cash_received: paid,
          items: cart.map((it) => ({
            product_id: String(it.productId),
            qty: Number(it.qty),
            unit_price: Number(it.price),
          })),
        };

        const apiRes = await tryApi(
          () => salesApi.create(token, params.businessId, apiBody),
          "salesApi.create",
        );

        const rawSale = (apiRes as any)?.data?.sale;
        if (rawSale) {
          const created: Sale = {
            id: String(rawSale.id),
            businessId: params.businessId,
            items: cart,
            subtotal: round2(toNum(rawSale.subtotal, totals.subtotal)),
            discount: round2(toNum(rawSale.discount, totals.discount)),
            taxableBase: totals.taxableBase,
            taxRate,
            taxAmount: round2(toNum(rawSale.tax, totals.taxAmount)),
            total: round2(toNum(rawSale.total, totals.total)),
            paymentMethod: "cash",
            paid,
            change,
            note: params.note?.trim() || undefined,
            createdAt: String(rawSale.created_at ?? new Date().toISOString()),
          };

          const current =
            getState().salesByBusiness[String(params.businessId)] ?? [];
          const nextList = [created, ...current].reduce<Sale[]>((acc, x) => {
            if (acc.some((s0) => s0.id === x.id)) return acc;
            acc.push(x);
            return acc;
          }, []);

          setState({
            salesByBusiness: {
              ...getState().salesByBusiness,
              [String(params.businessId)]: nextList,
            },
            lastSaleId: created.id,
            loading: false,
            cart: [],
            discount: 0,
          });
          await flush();

          void notificationActions.add({
            kind: "sales",
            title: "Venta registrada",
            body: `Total: $${created.total.toFixed(2)} · EFECTIVO`,
            meta: {
              route: "/(tabs)/sales/sales-history",
              payload: { saleId: created.id },
            },
          });

          return created;
        }
      }

      const demoSale = await salesService.createSale(
        userId,
        params.businessId,
        saleInput,
      );

      const current =
        getState().salesByBusiness[String(params.businessId)] ?? [];
      const nextList = [demoSale, ...current].reduce<Sale[]>((acc, x) => {
        if (acc.some((s0) => s0.id === x.id)) return acc;
        acc.push(x);
        return acc;
      }, []);

      setState({
        salesByBusiness: {
          ...getState().salesByBusiness,
          [String(params.businessId)]: nextList,
        },
        lastSaleId: demoSale.id,
        loading: false,
        cart: [],
        discount: 0,
      });
      await flush();

      void notificationActions.add({
        kind: "sales",
        title: "Venta registrada",
        body: `Total: $${demoSale.total.toFixed(2)} · ${demoSale.paymentMethod.toUpperCase()}`,
        meta: {
          route: "/(tabs)/sales/sales-history",
          payload: { saleId: demoSale.id },
        },
      });

      return demoSale;
    } catch (e: any) {
      setState({
        loading: false,
        error: e?.message ?? "No se pudo cerrar venta",
      });
      throw e;
    }
  },

  getSalesForBusiness(businessId: ID) {
    return getState().salesByBusiness[String(businessId)] ?? [];
  },

  getSale(businessId: ID, id: ID) {
    return (
      (getState().salesByBusiness[String(businessId)] ?? []).find(
        (s) => s.id === id,
      ) ?? null
    );
  },

  async fetchSaleDetail(businessId: ID, saleId: ID, token?: string | null) {
    if (!token) return null;

    const apiRes = await tryApi(
      () => salesApi.detail(token, businessId, saleId),
      "salesApi.detail",
    );

    const rawSale = (apiRes as any)?.data?.sale as ApiSaleDetail | undefined;
    const rawItems = (apiRes as any)?.data?.items as
      | ApiSaleDetailItem[]
      | undefined;

    if (!rawSale || !Array.isArray(rawItems)) return null;

    const currentList = getState().salesByBusiness[String(businessId)] ?? [];
    const existing =
      currentList.find((s) => String(s.id) === String(saleId)) ?? null;

    const merged = mergeSaleDetailIntoSale(
      existing,
      rawSale,
      rawItems,
      businessId,
    );

    const nextList = currentList.some((s) => String(s.id) === String(saleId))
      ? currentList.map((s) => (String(s.id) === String(saleId) ? merged : s))
      : [merged, ...currentList];

    setState({
      salesByBusiness: {
        ...getState().salesByBusiness,
        [String(businessId)]: nextList,
      },
    });
    await flush();

    return merged;
  },
};

export function useSalesStore<T>(selector: (s: State) => T): T {
  const snap = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(getState()),
    () => selector(getState()),
  );

  return useMemo(() => snap, [snap]);
}
