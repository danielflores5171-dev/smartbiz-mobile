// src/services/inventoryService.ts
import type { ID } from "../types/business";
import type { Product, StockAdjustment } from "../types/inventory";

const uid = () => Math.random().toString(36).slice(2, 10);

let products: Product[] = [];
let adjustments: StockAdjustment[] = [];

export const inventoryService = {
  async listProducts(businessId: ID): Promise<Product[]> {
    return products.filter((p) => p.businessId === businessId);
  },

  async createProduct(
    input: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<Product> {
    const now = new Date().toISOString();
    const created: Product = {
      id: `prd-${uid()}`,
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    products = [created, ...products];
    return created;
  },

  async updateProduct(id: ID, patch: Partial<Product>): Promise<Product> {
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    products[idx] = {
      ...products[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return products[idx];
  },

  async deleteProduct(id: ID): Promise<void> {
    products = products.filter((p) => p.id !== id);
    adjustments = adjustments.filter((a) => a.productId !== id);
  },

  async listAdjustments(businessId: ID): Promise<StockAdjustment[]> {
    return adjustments.filter((a) => a.businessId === businessId);
  },

  async addAdjustment(
    input: Omit<StockAdjustment, "id" | "createdAt">,
  ): Promise<StockAdjustment> {
    const created: StockAdjustment = {
      id: `adj-${uid()}`,
      createdAt: new Date().toISOString(),
      ...input,
    };
    adjustments = [created, ...adjustments];

    // opcional: si quieres que “API mock” también refleje stock:
    const idx = products.findIndex((p) => p.id === input.productId);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        stock: products[idx].stock + input.delta,
        updatedAt: new Date().toISOString(),
      };
    }

    return created;
  },
};
