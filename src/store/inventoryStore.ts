// src/store/inventoryStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";

import { inventoryService } from "../services/inventoryService";
import type { ID } from "../types/business";
import type { Product, StockAdjustment, StockReason } from "../types/inventory";

import { productApi, type ApiProductImageItem } from "@/src/api/productApi";
import { notificationActions } from "./notificationStore";

type State = {
  userId: string | null;
  products: Product[];
  adjustments: StockAdjustment[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
};

const BASE_KEY = "smartbiz.inventoryStore.v7";
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
let bootstrapInFlight = false;

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
      // demo silencioso
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
    // demo silencioso
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
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}` as ID;
}

function requireUserId() {
  const uid = getState().userId;
  if (!uid) {
    throw new Error("No hay usuario para inventario. (Falta bootstrap)");
  }
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

function mapApiItemToProduct(it: any, prefer?: Partial<Product>): Product {
  const businessId: ID =
    (it?.business_id as string | undefined) ??
    (prefer?.businessId as string | undefined) ??
    "";

  const active = Boolean(it?.active);

  return {
    id: String(it?.id ?? prefer?.id ?? "") as ID,
    businessId,

    name: String(it?.name ?? prefer?.name ?? ""),
    sku:
      it?.sku != null && String(it.sku).trim() !== ""
        ? String(it.sku)
        : prefer?.sku,
    barcode: prefer?.barcode,
    unit: (it?.unit as any) ?? prefer?.unit ?? "pz",

    price: Number(it?.price ?? prefer?.price ?? 0),
    cost: Number(it?.cost ?? prefer?.cost ?? 0),
    stock: Number(it?.stock ?? prefer?.stock ?? 0),
    minStock:
      it?.min_stock !== undefined && it?.min_stock !== null
        ? Number(it.min_stock)
        : prefer?.minStock,

    imageUri: prefer?.imageUri,
    imageUrl:
      it?.primary_image_url != null &&
      String(it.primary_image_url).trim() !== ""
        ? String(it.primary_image_url)
        : prefer?.imageUrl,

    status: active ? "active" : "archived",

    createdAt: String(
      it?.created_at ?? prefer?.createdAt ?? new Date().toISOString(),
    ),
    updatedAt: String(
      it?.updated_at ?? prefer?.updatedAt ?? new Date().toISOString(),
    ),
  };
}

function mapImageToUrl(
  uploaded?: ApiProductImageItem | null,
  storagePublicUrl?: string | null,
) {
  const fromItem =
    uploaded?.url && String(uploaded.url).trim() !== ""
      ? String(uploaded.url)
      : null;

  const fromStorage =
    storagePublicUrl && String(storagePublicUrl).trim() !== ""
      ? String(storagePublicUrl)
      : null;

  return fromItem ?? fromStorage ?? null;
}

export const inventoryActions = {
  async bootstrap(userId?: string) {
    console.log("[inventoryStore.bootstrap] userId=", userId);

    if (bootstrapInFlight) {
      console.log("[inventoryStore.bootstrap] skip: bootstrap en curso");
      return;
    }

    if (!userId) {
      if (!getState().hydrated) {
        setState({ hydrated: true }, { skipPersist: true });
      }
      console.log("[inventoryStore.bootstrap] skip: no userId");
      return;
    }

    if (getState().hydrated && getState().userId === userId) {
      console.log(
        "[inventoryStore.bootstrap] skip: ya hidratado para este usuario",
      );
      return;
    }

    bootstrapInFlight = true;

    try {
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
      await flush();
    } finally {
      bootstrapInFlight = false;
    }
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

  async loadProducts(businessId: ID, token?: string | null) {
    const tokenHead = String(token ?? "").slice(0, 10);

    console.log(
      "[inventoryStore.loadProducts] businessId=",
      businessId,
      "tokenHead=",
      tokenHead,
    );

    requireUserId();

    const local = getState().products.filter(
      (p) => p.businessId === businessId,
    );

    if (!token && local.length > 0) {
      console.log("[inventoryStore.loadProducts] skip: ya cargados local");
      return;
    }

    if (token && local.length > 0) {
      console.log(
        "[inventoryStore.loadProducts] local exists but token present, trying API",
      );
    }

    setState({ loading: true, error: null });

    if (token) {
      const apiRes = await tryApi(
        () => productApi.list(token, businessId),
        "productApi.list",
      );
      const rawItems = (apiRes as any)?.data?.items;

      if (Array.isArray(rawItems)) {
        console.log(
          "[inventoryStore.loadProducts] API items=",
          rawItems.length,
        );

        const items = rawItems.map((it: any) => mapApiItemToProduct(it));
        const withoutBiz = getState().products.filter(
          (p) => p.businessId !== businessId,
        );

        setState({
          products: [...items, ...withoutBiz],
          loading: false,
          error: null,
        });
        await flush();
        return;
      }
    } else {
      console.log("[inventoryStore.loadProducts] no token, skipping API");
    }

    console.log("[inventoryStore.loadProducts] fallback demo");

    try {
      const userId = requireUserId();
      const api = await inventoryService.listProducts(userId, businessId);

      const seed: Product[] =
        api.length > 0
          ? api
          : [
              {
                id: "prd-demo-1" as ID,
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

      setState({
        products: [...seed, ...withoutBiz],
        loading: false,
        error: null,
      });
      await flush();
    } catch (e: any) {
      setState({
        loading: false,
        error: e?.message ?? "Error",
      });
    }
  },

  async createProduct(
    input: Omit<Product, "id" | "createdAt" | "updatedAt">,
    token?: string | null,
  ) {
    console.log(
      "[inventoryStore.createProduct] businessId=",
      input.businessId,
      "name=",
      input.name,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    requireUserId();
    setState({ loading: true, error: null });

    if (token) {
      const apiRes = await tryApi(
        () =>
          productApi.create(token, input.businessId, {
            name: input.name,
            sku: input.sku,
            unit: input.unit,
            price: input.price,
            cost: input.cost,
            stock: input.stock,
            minStock: input.minStock,
          }),
        "productApi.create",
      );

      const it = (apiRes as any)?.data?.item;
      if (it) {
        const created = mapApiItemToProduct(it, {
          businessId: input.businessId,
          unit: input.unit,
          barcode: input.barcode,
          imageUri: input.imageUri,
          imageUrl: input.imageUrl,
          minStock: input.minStock,
        });

        setState({
          products: [created, ...getState().products],
          loading: false,
          error: null,
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
    } else {
      console.log("[inventoryStore.createProduct] no token, skipping API");
    }

    console.log("[inventoryStore.createProduct] fallback demo");

    try {
      const userId = requireUserId();
      const created = await inventoryService.createProduct(userId, input);

      setState({
        products: [created, ...getState().products],
        loading: false,
        error: null,
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
    } catch (e: any) {
      setState({
        loading: false,
        error: e?.message ?? "Error",
      });
      throw e;
    }
  },

  async updateProduct(id: ID, patch: Partial<Product>, token?: string | null) {
    console.log(
      "[inventoryStore.updateProduct] id=",
      id,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
      "patch=",
      patch,
    );

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

    if (token) {
      const safe: any = {};
      if (patch.name !== undefined) safe.name = patch.name;
      if (patch.sku !== undefined) safe.sku = patch.sku ?? null;
      if (patch.unit !== undefined) safe.unit = patch.unit ?? null;
      if (patch.price !== undefined) safe.price = patch.price;
      if (patch.cost !== undefined) safe.cost = patch.cost;
      if (patch.minStock !== undefined) safe.minStock = patch.minStock;
      if (patch.status !== undefined) safe.status = patch.status;

      const apiRes = await tryApi(
        () => productApi.update(token, current.businessId, id, safe),
        "productApi.update",
      );
      const it = (apiRes as any)?.data?.item;

      if (it) {
        const merged = mapApiItemToProduct(it, {
          ...optimistic,
          barcode: optimistic.barcode,
          imageUri: optimistic.imageUri,
          imageUrl: optimistic.imageUrl,
          unit: optimistic.unit,
        });

        setState({
          products: getState().products.map((p) => (p.id === id ? merged : p)),
          loading: false,
          error: null,
        });
        await flush();
        return merged;
      }
    } else {
      console.log("[inventoryStore.updateProduct] no token, skipping API");
    }

    console.log("[inventoryStore.updateProduct] fallback demo");

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
        error: null,
      });
      await flush();
      return merged;
    } catch {
      setState({ loading: false });
      await flush();
      return optimistic;
    }
  },

  async deleteProduct(id: ID, token?: string | null) {
    console.log(
      "[inventoryStore.deleteProduct] id=",
      id,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    requireUserId();

    const current = getState().products.find((p) => p.id === id);

    setState({
      products: getState().products.filter((p) => p.id !== id),
      adjustments: getState().adjustments.filter((a) => a.productId !== id),
      loading: true,
      error: null,
    });

    if (token && current) {
      const ok = await tryApi(
        () => productApi.remove(token, current.businessId, id),
        "productApi.remove",
      );
      if (ok) {
        setState({ loading: false, error: null });
        await flush();
        return;
      }
    } else if (!token) {
      console.log("[inventoryStore.deleteProduct] no token, skipping API");
    }

    console.log("[inventoryStore.deleteProduct] fallback demo");

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

  async attachProductImage(
    productId: ID,
    localImageUri: string,
    token?: string | null,
  ) {
    console.log(
      "[inventoryStore.attachProductImage] productId=",
      productId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    const userId = requireUserId();

    const current = getState().products.find((p) => p.id === productId);
    if (!current) throw new Error("Product not found");

    const optimistic: Product = {
      ...current,
      imageUri: localImageUri,
      updatedAt: new Date().toISOString(),
    };

    setState({
      products: getState().products.map((p) =>
        p.id === productId ? optimistic : p,
      ),
    });
    await flush();

    if (token) {
      const uploadRes = await tryApi(
        () =>
          productApi.uploadImage(
            token,
            current.businessId,
            productId,
            localImageUri,
          ),
        "productApi.uploadImage",
      );

      const uploaded = (uploadRes as any)?.data?.item as
        | ApiProductImageItem
        | undefined;
      const storagePublicUrl = (uploadRes as any)?.data?.storage?.publicUrl as
        | string
        | null
        | undefined;

      if (uploaded?.id) {
        await tryApi(
          () =>
            productApi.setPrimaryImage(
              token,
              current.businessId,
              productId,
              String(uploaded.id) as ID,
            ),
          "productApi.setPrimaryImage",
        );
      }

      const remoteUrl = mapImageToUrl(uploaded, storagePublicUrl);

      if (remoteUrl) {
        const merged: Product = {
          ...optimistic,
          imageUrl: remoteUrl,
          updatedAt: new Date().toISOString(),
        };

        setState({
          products: getState().products.map((p) =>
            p.id === productId ? merged : p,
          ),
        });
        await flush();

        console.log(
          "[inventoryStore.attachProductImage] backend image OK url=",
          remoteUrl,
        );

        return merged;
      }
    } else {
      console.log("[inventoryStore.attachProductImage] no token, skipping API");
    }

    console.log("[inventoryStore.attachProductImage] fallback demo");

    try {
      const saved = await inventoryService.updateProduct(userId, productId, {
        imageUri: localImageUri,
        imageUrl: undefined,
      });

      setState({
        products: getState().products.map((p) =>
          p.id === productId ? saved : p,
        ),
        error: null,
      });
      await flush();

      console.log("[inventoryStore.attachProductImage] demo persist OK");
      return saved;
    } catch (e: any) {
      console.log(
        "[inventoryStore.attachProductImage] demo persist FAIL:",
        String(e),
      );
      return optimistic;
    }
  },

  async removeProductImage(productId: ID, token?: string | null) {
    console.log(
      "[inventoryStore.removeProductImage] productId=",
      productId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    const userId = requireUserId();

    const current = getState().products.find((p) => p.id === productId);
    if (!current) throw new Error("Product not found");

    const optimistic: Product = {
      ...current,
      imageUri: undefined,
      imageUrl: undefined,
      updatedAt: new Date().toISOString(),
    };

    setState({
      products: getState().products.map((p) =>
        p.id === productId ? optimistic : p,
      ),
    });
    await flush();

    if (token) {
      const listRes = await tryApi(
        () => productApi.listImages(token, current.businessId, productId),
        "productApi.listImages",
      );

      const items = ((listRes as any)?.data?.items ??
        []) as ApiProductImageItem[];

      if (Array.isArray(items) && items.length > 0) {
        for (const img of items) {
          await tryApi(
            () =>
              productApi.deleteImage(
                token,
                current.businessId,
                productId,
                String(img.id) as ID,
              ),
            "productApi.deleteImage",
          );
        }

        console.log("[inventoryStore.removeProductImage] backend delete OK");
        return optimistic;
      }
    } else {
      console.log("[inventoryStore.removeProductImage] no token, skipping API");
    }

    console.log("[inventoryStore.removeProductImage] fallback demo");

    try {
      const saved = await inventoryService.updateProduct(userId, productId, {
        imageUri: undefined,
        imageUrl: undefined,
      });

      setState({
        products: getState().products.map((p) =>
          p.id === productId ? saved : p,
        ),
        error: null,
      });
      await flush();

      console.log("[inventoryStore.removeProductImage] demo persist OK");
      return saved;
    } catch (e: any) {
      console.log(
        "[inventoryStore.removeProductImage] demo persist FAIL:",
        String(e),
      );
      return optimistic;
    }
  },

  getProduct(id: ID) {
    return getState().products.find((p) => p.id === id) ?? null;
  },

  async adjustStock(
    params: {
      productId: ID;
      delta: number;
      reason: StockReason;
      note?: string;
    },
    token?: string | null,
  ) {
    const { productId, delta, reason, note } = params;

    console.log(
      "[inventoryStore.adjustStock] productId=",
      productId,
      "delta=",
      delta,
      "reason=",
      reason,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    requireUserId();

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

    if (token) {
      const ok = await tryApi(
        () =>
          productApi.stock(token, businessId, productId, {
            delta,
            reason,
            note,
          }),
        "productApi.stock",
      );
      if (ok) return;
    } else {
      console.log("[inventoryStore.adjustStock] no token, skipping API");
    }

    console.log("[inventoryStore.adjustStock] fallback demo");

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

  async loadMovements(productId: ID, token?: string | null) {
    console.log(
      "[inventoryStore.loadMovements] productId=",
      productId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );
    return null;
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
