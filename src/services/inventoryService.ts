// src/services/inventoryService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ID } from "../types/business";
import type { Product, StockAdjustment } from "../types/inventory";

const uid = () => Math.random().toString(36).slice(2, 10);

const BASE_KEY = "smartbiz.inventory.v1";
const keyForUser = (userId: string) => `${BASE_KEY}:${userId}`;

type Stored = {
  products: Product[];
  adjustments: StockAdjustment[];
};

async function read(userId: string): Promise<Stored> {
  const raw = await AsyncStorage.getItem(keyForUser(userId));
  if (!raw) return { products: [], adjustments: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return {
      products: parsed.products ?? [],
      adjustments: parsed.adjustments ?? [],
    };
  } catch {
    return { products: [], adjustments: [] };
  }
}

async function write(userId: string, data: Stored) {
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify(data));
}

export const inventoryService = {
  async listProducts(userId: string, businessId: ID): Promise<Product[]> {
    const db = await read(userId);
    return db.products.filter((p) => p.businessId === businessId);
  },

  async createProduct(
    userId: string,
    input: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<Product> {
    const db = await read(userId);
    const now = new Date().toISOString();

    const created: Product = {
      id: `prd-${uid()}` as any,
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    db.products = [created, ...db.products];
    await write(userId, db);
    return created;
  },

  async updateProduct(
    userId: string,
    id: ID,
    patch: Partial<Product>,
  ): Promise<Product> {
    const db = await read(userId);
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");

    db.products[idx] = {
      ...db.products[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await write(userId, db);
    return db.products[idx];
  },

  async deleteProduct(userId: string, id: ID): Promise<void> {
    const db = await read(userId);
    db.products = db.products.filter((p) => p.id !== id);
    db.adjustments = db.adjustments.filter((a) => a.productId !== id);
    await write(userId, db);
  },

  async listAdjustments(
    userId: string,
    businessId: ID,
  ): Promise<StockAdjustment[]> {
    const db = await read(userId);
    return db.adjustments.filter((a) => a.businessId === businessId);
  },

  async addAdjustment(
    userId: string,
    input: Omit<StockAdjustment, "id" | "createdAt">,
  ): Promise<StockAdjustment> {
    const db = await read(userId);

    const created: StockAdjustment = {
      id: `adj-${uid()}` as any,
      createdAt: new Date().toISOString(),
      ...input,
    };

    db.adjustments = [created, ...db.adjustments];

    // opcional: reflejar stock en producto
    const idx = db.products.findIndex((p) => p.id === input.productId);
    if (idx !== -1) {
      db.products[idx] = {
        ...db.products[idx],
        stock: db.products[idx].stock + input.delta,
        updatedAt: new Date().toISOString(),
      };
    }

    await write(userId, db);
    return created;
  },
};
