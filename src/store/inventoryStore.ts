// src/store/inventoryStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";

import { inventoryService } from "../services/inventoryService";
import type { ID } from "../types/business";
import type { Product, StockAdjustment, StockReason } from "../types/inventory";

import { notificationActions } from "./notificationStore";

type State = {
  products: Product[];
  adjustments: StockAdjustment[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
};

const STORAGE_KEY = "smartbiz.inventoryStore.v1";

const state: State = {
  products: [],
  adjustments: [],
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
  if (!getState().hydrated) return;
  if (persistTimer) clearTimeout(persistTimer);

  persistTimer = setTimeout(async () => {
    const s = getState();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        products: s.products,
        adjustments: s.adjustments,
      }),
    );
  }, 150);
}

async function hydrate() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    Object.assign(state, {
      products: [],
      adjustments: [],
      loading: false,
      error: null,
      hydrated: true,
    });
    emit();
    return;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<State>;
    Object.assign(state, {
      products: parsed.products ?? [],
      adjustments: parsed.adjustments ?? [],
      loading: false,
      error: null,
      hydrated: true,
    });
    emit();

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        products: state.products,
        adjustments: state.adjustments,
      }),
    );
  } catch {
    Object.assign(state, { hydrated: true });
    emit();
  }
}

function genId(prefix: string): ID {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}` as unknown as ID;
}

export const inventoryActions = {
  async bootstrap() {
    if (getState().hydrated) return;
    await hydrate();
  },

  async loadProducts(businessId: ID) {
    const local = getState().products.filter(
      (p) => p.businessId === businessId,
    );
    if (local.length > 0) return;

    setState({ loading: true, error: null });

    try {
      const api = await inventoryService.listProducts(businessId);

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
    } catch (e: any) {
      setState({ loading: false, error: e?.message ?? "Error" });
    }
  },

  async createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt">) {
    setState({ loading: true, error: null });

    try {
      const created = await inventoryService.createProduct(input);
      setState({ products: [created, ...getState().products], loading: false });

      // ✅ notificación (si notifs está bootstrap)
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

  async updateProduct(id: ID, patch: Partial<Product>) {
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

    try {
      const api = await inventoryService.updateProduct(id, patch);

      const merged: Product = {
        ...optimistic,
        ...api,
        updatedAt: api.updatedAt ?? optimistic.updatedAt,
      };

      setState({
        products: getState().products.map((p) => (p.id === id ? merged : p)),
        loading: false,
      });

      return merged;
    } catch {
      setState({ loading: false });
      return optimistic;
    }
  },

  async deleteProduct(id: ID) {
    setState({
      products: getState().products.filter((p) => p.id !== id),
      adjustments: getState().adjustments.filter((a) => a.productId !== id),
      loading: true,
      error: null,
    });

    try {
      await inventoryService.deleteProduct(id);
    } catch {
      // demo
    } finally {
      setState({ loading: false });
    }
  },

  getProduct(id: ID) {
    return getState().products.find((p) => p.id === id) ?? null;
  },

  async adjustStock(params: {
    productId: ID;
    delta: number;
    reason: StockReason;
    note?: string;
  }) {
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

    // ✅ NOTIF: movimiento
    void notificationActions.add({
      kind: "inventory",
      title: "Movimiento de inventario",
      body: `${current.name}: ${delta > 0 ? `+${delta}` : `${delta}`} (${reason})`,
      meta: {
        route: "/(tabs)/inventory",
        payload: { productId, delta, reason },
      },
    });

    // ✅ NOTIF: bajo stock
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

    try {
      await inventoryService.addAdjustment({
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
