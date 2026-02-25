// src/store/inventoryStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";

import { inventoryService } from "../services/inventoryService";
import type { ID } from "../types/business";
import type { Product, StockAdjustment, StockReason } from "../types/inventory";

import { notificationActions } from "./notificationStore";

// ✅ usa tu cliente HTTP que ya maneja Bearer y contrato {ok:true,data:{}}
import { apiRequest } from "@/src/lib/apiClient";

type State = {
  userId: string | null;

  products: Product[];
  adjustments: StockAdjustment[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
};

const BASE_KEY = "smartbiz.inventoryStore.v2";
const keyForUser = (userId: string) => `${BASE_KEY}:${userId}`;

const state: State = {
  userId: null,
  products: [],
  adjustments: [],
  loading: false,
  error: null,
  hydrated: false,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function getState() {
  return state;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function persistNow() {
  const s = getState();
  if (!s.hydrated) return;
  if (!s.userId) return;

  await AsyncStorage.setItem(
    keyForUser(s.userId),
    JSON.stringify({
      products: s.products,
      adjustments: s.adjustments,
    }),
  );
}

function persist() {
  const s = getState();
  if (!s.hydrated) return;
  if (!s.userId) return;

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      await persistNow();
    } catch {
      // demo
    }
  }, 150);
}

async function flush() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    await persistNow();
  } catch {
    // demo
  }
}

function setState(patch: Partial<State>, opts?: { skipPersist?: boolean }) {
  Object.assign(state, patch);
  emit();
  if (!opts?.skipPersist) persist();
}

async function hydrateForUser(userId: string) {
  const raw = await AsyncStorage.getItem(keyForUser(userId));

  if (!raw) {
    setState(
      {
        userId,
        products: [],
        adjustments: [],
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
        products: parsed?.products ?? [],
        adjustments: parsed?.adjustments ?? [],
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
        products: [],
        adjustments: [],
        loading: false,
        error: null,
        hydrated: true,
      },
      { skipPersist: true },
    );
  }
}

function genId(prefix: string): ID {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}` as unknown as ID;
}

function requireUserId() {
  const uid = getState().userId;
  if (!uid)
    throw new Error("No hay usuario para inventario. (Falta bootstrap)");
  return uid;
}

// ✅ helper: intenta API; si falla, regresa null (para fallback demo)
async function tryApi<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export const inventoryActions = {
  // ✅ boot por usuario
  async bootstrap(userId?: string) {
    if (!userId) {
      if (!getState().hydrated)
        setState({ hydrated: true }, { skipPersist: true });
      return;
    }

    if (getState().hydrated && getState().userId === userId) return;

    setState(
      {
        userId,
        hydrated: false,
        loading: true,
        error: null,
        products: [],
        adjustments: [],
      },
      { skipPersist: true },
    );

    await hydrateForUser(userId);
    setState({ loading: false, hydrated: true });
  },

  clearLocalMemoryOnly() {
    setState(
      {
        userId: null,
        products: [],
        adjustments: [],
        loading: false,
        error: null,
        hydrated: false,
      },
      { skipPersist: true },
    );
  },

  async clearLocalAndStorage() {
    const uid = getState().userId;
    this.clearLocalMemoryOnly();
    if (uid) {
      try {
        await AsyncStorage.removeItem(keyForUser(uid));
      } catch {
        // demo
      }
    }
  },

  async flush() {
    await flush();
  },

  /**
   * ✅ Carga productos por businessId
   * - Si pasas token, intenta API real: GET /api/product (con header X-Business-Id)
   * - Si falla o no hay token, usa demo: inventoryService
   */
  async loadProducts(businessId: ID, token?: string | null) {
    requireUserId();

    const local = getState().products.filter(
      (p) => p.businessId === businessId,
    );
    if (local.length > 0) return;

    setState({ loading: true, error: null });

    // 1) API real
    if (token) {
      const apiRes = await tryApi(() =>
        apiRequest<{ items: Product[] }>("/api/product", {
          method: "GET",
          token,
          businessId: String(businessId),
        }),
      );

      const items = (apiRes as any)?.data?.items as Product[] | undefined;
      if (items && Array.isArray(items)) {
        const withoutBiz = getState().products.filter(
          (p) => p.businessId !== businessId,
        );
        setState({ products: [...items, ...withoutBiz], loading: false });
        await flush();
        return;
      }
    }

    // 2) Fallback demo
    try {
      const userId = requireUserId();
      const api = await inventoryService.listProducts(userId, businessId);

      const seed: Product[] =
        api.length > 0
          ? api
          : [
              {
                id: "prd-demo-1" as unknown as ID,
                businessId,
                name: "Producto demo",
                sku: "SKU-001",
                unit: "pz",
                price: 199,
                cost: 120,
                stock: 10,
                minStock: 2,
                status: "active",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];

      const withoutBiz = getState().products.filter(
        (p) => p.businessId !== businessId,
      );
      setState({ products: [...seed, ...withoutBiz], loading: false });
      await flush();
    } catch (e: any) {
      setState({ loading: false, error: e?.message ?? "Error" });
    }
  },

  /**
   * ✅ Crea producto
   * - API real: POST /api/product (con X-Business-Id y body)
   * - Fallback demo: inventoryService.createProduct
   */
  async createProduct(
    input: Omit<Product, "id" | "createdAt" | "updatedAt">,
    token?: string | null,
  ) {
    requireUserId();
    setState({ loading: true, error: null });

    // 1) API real
    if (token) {
      const apiRes = await tryApi(() =>
        apiRequest<{ product: Product }>("/api/product", {
          method: "POST",
          token,
          businessId: String(input.businessId),
          body: input,
        }),
      );
      const created = (apiRes as any)?.data?.product as Product | undefined;
      if (created) {
        setState({
          products: [created, ...getState().products],
          loading: false,
        });
        await flush();

        void notificationActions.add({
          kind: "inventory",
          title: "Producto creado",
          body: `Se agregó "${created.name}" al inventario.`,
          meta: {
            route: "/(tabs)/inventory",
            payload: { productId: created.id },
          },
        });

        return created;
      }
    }

    // 2) Fallback demo
    try {
      const userId = requireUserId();
      const created = await inventoryService.createProduct(userId, input);
      setState({ products: [created, ...getState().products], loading: false });
      await flush();

      void notificationActions.add({
        kind: "inventory",
        title: "Producto creado",
        body: `Se agregó "${created.name}" al inventario.`,
        meta: {
          route: "/(tabs)/inventory",
          payload: { productId: created.id },
        },
      });

      return created;
    } catch (e: any) {
      setState({ loading: false, error: e?.message ?? "Error" });
      throw e;
    }
  },

  /**
   * ✅ Actualiza producto
   * - API real: PATCH /api/product/:id
   * - fallback demo: inventoryService.updateProduct
   */
  async updateProduct(id: ID, patch: Partial<Product>, token?: string | null) {
    requireUserId();

    const current = getState().products.find((p) => p.id === id);
    if (!current) throw new Error("Product not found");

    const optimistic: Product = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    setState({
      products: getState().products.map((p) => (p.id === id ? optimistic : p)),
      loading: true,
      error: null,
    });

    // 1) API real
    if (token) {
      const apiRes = await tryApi(() =>
        apiRequest<{ product: Product }>(`/api/product/${id}`, {
          method: "PATCH",
          token,
          businessId: String(current.businessId),
          body: patch,
        }),
      );
      const apiProduct = (apiRes as any)?.data?.product as Product | undefined;
      if (apiProduct) {
        const merged: Product = {
          ...optimistic,
          ...apiProduct,
          updatedAt: apiProduct.updatedAt ?? optimistic.updatedAt,
        };
        setState({
          products: getState().products.map((p) => (p.id === id ? merged : p)),
          loading: false,
        });
        await flush();
        return merged;
      }
    }

    // 2) fallback demo
    try {
      const userId = requireUserId();
      const api = await inventoryService.updateProduct(userId, id, patch);
      const merged: Product = {
        ...optimistic,
        ...api,
        updatedAt: api.updatedAt ?? optimistic.updatedAt,
      };
      setState({
        products: getState().products.map((p) => (p.id === id ? merged : p)),
        loading: false,
      });
      await flush();
      return merged;
    } catch {
      setState({ loading: false });
      await flush();
      return optimistic;
    }
  },

  /**
   * ✅ Elimina producto
   * - API real: DELETE /api/product/:id
   * - fallback demo: inventoryService.deleteProduct
   */
  async deleteProduct(id: ID, token?: string | null) {
    requireUserId();

    const current = getState().products.find((p) => p.id === id);

    setState({
      products: getState().products.filter((p) => p.id !== id),
      adjustments: getState().adjustments.filter((a) => a.productId !== id),
      loading: true,
      error: null,
    });

    // 1) API real
    if (token && current) {
      const ok = await tryApi(() =>
        apiRequest<{}>(`/api/product/${id}`, {
          method: "DELETE",
          token,
          businessId: String(current.businessId),
        }),
      );
      if (ok) {
        setState({ loading: false });
        await flush();
        return;
      }
    }

    // 2) fallback demo
    try {
      const userId = requireUserId();
      await inventoryService.deleteProduct(userId, id);
    } catch {
      // demo
    } finally {
      setState({ loading: false });
      await flush();
    }
  },

  getProduct(id: ID) {
    return getState().products.find((p) => p.id === id) ?? null;
  },

  /**
   * ✅ Ajuste de stock
   * - API real: POST /api/product/:id/stock
   * - fallback demo: inventoryService.addAdjustment
   */
  async adjustStock(
    params: {
      productId: ID;
      delta: number;
      reason: StockReason;
      note?: string;
    },
    token?: string | null,
  ) {
    requireUserId();
    const { productId, delta, reason, note } = params;

    const current = getState().products.find((p) => p.id === productId);
    if (!current) throw new Error("Product not found");

    const businessId = current.businessId;
    const nextStock = current.stock + delta;

    const nextProducts = getState().products.map((p) =>
      p.id === productId
        ? { ...p, stock: nextStock, updatedAt: new Date().toISOString() }
        : p,
    );

    const adj: StockAdjustment = {
      id: genId("adj-local"),
      businessId,
      productId,
      delta,
      reason,
      note,
      createdAt: new Date().toISOString(),
    };

    setState({
      products: nextProducts,
      adjustments: [adj, ...getState().adjustments],
    });
    await flush();

    void notificationActions.add({
      kind: "inventory",
      title: "Movimiento de inventario",
      body: `${current.name}: ${delta > 0 ? `+${delta}` : `${delta}`} (${reason})`,
      meta: {
        route: "/(tabs)/inventory",
        payload: { productId, delta, reason },
      },
    });

    if (current.minStock != null && nextStock <= current.minStock) {
      void notificationActions.add({
        kind: "inventory",
        title: "Alerta: stock bajo",
        body: `${current.name} quedó en ${nextStock} (mínimo ${current.minStock})`,
        meta: {
          route: "/(tabs)/inventory",
          payload: { productId, stock: nextStock, minStock: current.minStock },
        },
      });
    }

    // 1) API real
    if (token) {
      const ok = await tryApi(() =>
        apiRequest<{ product?: Product }>(`/api/product/${productId}/stock`, {
          method: "POST",
          token,
          businessId: String(businessId),
          body: { delta, reason, note },
        }),
      );
      if (ok) return;
    }

    // 2) fallback demo
    try {
      const userId = requireUserId();
      await inventoryService.addAdjustment(userId, {
        businessId,
        productId,
        delta,
        reason,
        note,
      });
    } catch {
      // demo
    }
  },

  /**
   * (Opcional) Movimientos reales: GET /api/product/:id/movements
   */
  async loadMovements(productId: ID, token?: string | null) {
    const current = getState().products.find((p) => p.id === productId);
    if (!current || !token) return null;

    const res = await tryApi(() =>
      apiRequest<{ items: any[] }>(`/api/product/${productId}/movements`, {
        method: "GET",
        token,
        businessId: String(current.businessId),
      }),
    );

    return (res as any)?.data?.items ?? null;
  },
};

export function useInventoryStore<T>(selector: (s: State) => T): T {
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
