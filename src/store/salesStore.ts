// src/store/salesStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";
import { salesService } from "../services/salesService";
import type { ID } from "../types/business";
import type { CartItem, PaymentMethod, Sale } from "../types/sales";
import { inventoryActions } from "./inventoryStore";
import { notificationActions } from "./notificationStore";

// ✅ API client real (Bearer + contrato {ok:true,data:{...}})
import { apiRequest } from "@/src/lib/apiClient";

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

const BASE_KEY = "smartbiz.salesStore.v1";
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

function setState(patch: Partial<State>, opts?: { skipPersist?: boolean }) {
  Object.assign(state, patch);
  emit();
  if (!opts?.skipPersist) void persist();
}
function getState() {
  return state;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

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
      // demo
    }
  }, 150);
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

// ✅ helper: intenta API; si falla, regresa null (fallback demo)
async function tryApi<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export const salesActions = {
  async bootstrap(userId?: string) {
    if (!userId) {
      if (!getState().hydrated)
        setState({ hydrated: true }, { skipPersist: true });
      return;
    }

    if (getState().hydrated && getState().userId === userId) return;

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

    void persist();
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

  /**
   * ✅ Carga ventas por business
   * - API real: GET /api/sales (con X-Business-Id)
   * - fallback demo: salesService.listSales
   */
  async loadSales(businessId: ID, token?: string | null) {
    requireUserId();
    setState({ loading: true, error: null });

    // 1) API real
    if (token) {
      const apiRes = await tryApi(() =>
        apiRequest<{ items: Sale[] }>("/api/sales", {
          method: "GET",
          token,
          businessId: String(businessId),
        }),
      );

      const items = (apiRes as any)?.data?.items as Sale[] | undefined;
      if (items && Array.isArray(items)) {
        const next = { ...getState().salesByBusiness, [businessId]: items };
        setState({ salesByBusiness: next, loading: false, error: null });
        return;
      }
    }

    // 2) fallback demo
    try {
      const userId = requireUserId();
      const api = await salesService.listSales(userId, businessId);
      const next = { ...getState().salesByBusiness, [businessId]: api };
      setState({ salesByBusiness: next, loading: false, error: null });
    } catch (e: any) {
      setState({
        loading: false,
        error: e?.message ?? "Error cargando ventas",
      });
    }
  },

  /**
   * ✅ Elimina venta
   * - API real: DELETE /api/sales/:saleId (con X-Business-Id)
   * - fallback demo: salesService.deleteSale
   */
  async deleteSale(businessId: ID, id: ID, token?: string | null) {
    const userId = getState().userId;

    const current = getState().salesByBusiness[businessId] ?? [];
    const nextList = current.filter((s) => s.id !== id);

    setState({
      salesByBusiness: {
        ...getState().salesByBusiness,
        [businessId]: nextList,
      },
    });

    // 1) API real
    if (token) {
      const ok = await tryApi(() =>
        apiRequest<{}>(`/api/sales/${id}`, {
          method: "DELETE",
          token,
          businessId: String(businessId),
        }),
      );
      if (ok) return;
    }

    // 2) fallback demo
    if (userId) {
      void salesService.deleteSale(userId, businessId, id).catch(() => {});
    }
  },

  addToCart(item: Omit<CartItem, "qty">) {
    const cart = getState().cart.slice();
    const idx = cart.findIndex((c) => c.productId === item.productId);
    if (idx >= 0) cart[idx] = { ...cart[idx], qty: cart[idx].qty + 1 };
    else cart.unshift({ ...item, qty: 1 });
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

  /**
   * ✅ Checkout / crear venta
   * - API real: POST /api/sales (con X-Business-Id + body)
   * - fallback demo: salesService.createSale
   *
   * También intenta ajustar stock (API si token, demo si no).
   */
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

    // 1) descuenta inventario (API si token, demo si no)
    try {
      for (const it of cart) {
        await inventoryActions.adjustStock(
          {
            productId: it.productId as any,
            delta: -Math.abs(it.qty),
            reason: "Venta",
            note: `Venta (pendiente de id)`,
          },
          token,
        );
      }
    } catch {
      // demo
    }

    // 2) Crear venta persistente (API real primero)
    try {
      // API real
      if (token) {
        const apiRes = await tryApi(() =>
          apiRequest<{ sale: Sale }>("/api/sales", {
            method: "POST",
            token,
            businessId: String(params.businessId),
            body: saleInput,
          }),
        );

        const apiSale = (apiRes as any)?.data?.sale as Sale | undefined;
        if (apiSale) {
          const current = getState().salesByBusiness[params.businessId] ?? [];
          const nextList = [apiSale, ...current].reduce<Sale[]>((acc, x) => {
            if (acc.some((s) => s.id === x.id)) return acc;
            acc.push(x);
            return acc;
          }, []);

          setState({
            salesByBusiness: {
              ...getState().salesByBusiness,
              [params.businessId]: nextList,
            },
            lastSaleId: apiSale.id,
            loading: false,
          });

          setState({ cart: [], discount: 0 });

          void notificationActions.add({
            kind: "sales",
            title: "Venta registrada",
            body: `Total: $${apiSale.total.toFixed(2)} · ${apiSale.paymentMethod.toUpperCase()}`,
            meta: {
              route: "/(tabs)/sales/sales-history",
              payload: { saleId: apiSale.id },
            },
          });

          return apiSale;
        }
      }

      // fallback demo
      const apiSale = await salesService.createSale(
        userId,
        params.businessId,
        saleInput,
      );

      const current = getState().salesByBusiness[params.businessId] ?? [];
      const nextList = [apiSale, ...current].reduce<Sale[]>((acc, x) => {
        if (acc.some((s) => s.id === x.id)) return acc;
        acc.push(x);
        return acc;
      }, []);

      setState({
        salesByBusiness: {
          ...getState().salesByBusiness,
          [params.businessId]: nextList,
        },
        lastSaleId: apiSale.id,
        loading: false,
      });

      setState({ cart: [], discount: 0 });

      void notificationActions.add({
        kind: "sales",
        title: "Venta registrada",
        body: `Total: $${apiSale.total.toFixed(2)} · ${apiSale.paymentMethod.toUpperCase()}`,
        meta: {
          route: "/(tabs)/sales/sales-history",
          payload: { saleId: apiSale.id },
        },
      });

      return apiSale;
    } catch (e: any) {
      setState({
        loading: false,
        error: e?.message ?? "No se pudo cerrar venta",
      });
      throw e;
    }
  },

  getSalesForBusiness(businessId: ID) {
    return getState().salesByBusiness[businessId] ?? [];
  },

  getSale(businessId: ID, id: ID) {
    return (
      (getState().salesByBusiness[businessId] ?? []).find((s) => s.id === id) ??
      null
    );
  },

  /**
   * (Opcional) Traer detalle real cuando ya lo quieras usar:
   * GET /api/sales/:saleId
   */
  async fetchSaleDetail(businessId: ID, saleId: ID, token?: string | null) {
    if (!token) return null;
    const res = await tryApi(() =>
      apiRequest<{ sale: Sale }>(`/api/sales/${saleId}`, {
        method: "GET",
        token,
        businessId: String(businessId),
      }),
    );
    return (res as any)?.data?.sale ?? null;
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
