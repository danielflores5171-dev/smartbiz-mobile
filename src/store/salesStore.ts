// src/store/salesStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";
import { salesService } from "../services/salesService";
import type { ID } from "../types/business";
import type { CartItem, PaymentMethod, Sale } from "../types/sales";
import { inventoryActions } from "./inventoryStore";

// ✅ opcional: notificación al cerrar venta (si ya está bootstrap de notifs)
import { notificationActions } from "./notificationStore";

type State = {
  // por usuario
  userId: string | null;

  cart: CartItem[];
  discount: number; // monto fijo
  salesByBusiness: Record<string, Sale[]>; // businessId -> sales

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

function setState(patch: Partial<State>) {
  Object.assign(state, patch);
  emit();
  void persist();
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
    await AsyncStorage.setItem(
      keyForUser(s.userId!),
      JSON.stringify({
        cart: s.cart,
        discount: s.discount,
        salesByBusiness: s.salesByBusiness,
        lastSaleId: s.lastSaleId,
      }),
    );
  }, 150);
}

async function hydrateForUser(userId: string) {
  const raw = await AsyncStorage.getItem(keyForUser(userId));
  if (!raw) {
    Object.assign(state, {
      userId,
      cart: [],
      discount: 0,
      salesByBusiness: {},
      lastSaleId: null,
      loading: false,
      error: null,
      hydrated: true,
    });
    emit();
    return;
  }

  try {
    const parsed = JSON.parse(raw) as any;
    Object.assign(state, {
      userId,
      cart: parsed?.cart ?? [],
      discount: parsed?.discount ?? 0,
      salesByBusiness: parsed?.salesByBusiness ?? {},
      lastSaleId: parsed?.lastSaleId ?? null,
      loading: false,
      error: null,
      hydrated: true,
    });
    emit();
  } catch {
    Object.assign(state, { userId, hydrated: true });
    emit();
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

export const salesActions = {
  // ✅ boot por usuario
  async bootstrap(userId?: string) {
    // compat: si no pasan userId, solo marcamos hydrated para no tronar UI vieja
    if (!userId) {
      if (!getState().hydrated) setState({ hydrated: true });
      return;
    }

    if (getState().hydrated && getState().userId === userId) return;

    setState({
      hydrated: false,
      loading: false,
      error: null,
      userId,
      cart: [],
      discount: 0,
      salesByBusiness: {},
      lastSaleId: null,
    });

    await hydrateForUser(userId);
  },

  clearLocal() {
    setState({
      cart: [],
      discount: 0,
      salesByBusiness: {},
      lastSaleId: null,
      loading: false,
      error: null,
      hydrated: false,
      userId: null,
    });
  },

  // “GET” ventas por negocio (trae de AsyncStorage via service)
  async loadSales(businessId: ID) {
    const userId = requireUserId();
    setState({ loading: true, error: null });

    try {
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

  deleteSale(businessId: ID, id: ID) {
    const userId = getState().userId;
    const current = getState().salesByBusiness[businessId] ?? [];
    const nextList = current.filter((s) => s.id !== id);

    setState({
      salesByBusiness: {
        ...getState().salesByBusiness,
        [businessId]: nextList,
      },
    });

    if (userId) {
      void salesService.deleteSale(userId, businessId, id).catch(() => {});
    }
  },

  // carrito
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

  // “POST” Cerrar venta + descontar inventario
  async checkout(params: {
    businessId: ID;
    paymentMethod: PaymentMethod;
    paid: number;
    note?: string;
    taxRate?: number;
  }) {
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

    // 1) descuenta inventario (demo)
    try {
      for (const it of cart) {
        await inventoryActions.adjustStock({
          productId: it.productId as any,
          delta: -Math.abs(it.qty),
          reason: "Venta",
          note: `Venta (pendiente de id)`,
        });
      }
    } catch {
      // demo: si falla, no tronamos
    }

    // 2) crea venta persistente por usuario+negocio
    try {
      const apiSale = await salesService.createSale(
        userId,
        params.businessId,
        saleInput,
      );

      // 3) refresca cache local del negocio
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

      // 4) limpia carrito
      setState({ cart: [], discount: 0 });

      // 5) notificación (opcional)
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
