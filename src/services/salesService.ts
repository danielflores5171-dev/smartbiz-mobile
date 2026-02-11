// src/services/salesService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ID } from "../types/business";
import type { Sale } from "../types/sales";

const uid = () => Math.random().toString(36).slice(2, 10);

const BASE_KEY = "smartbiz.sales.v1";

function keyFor(userId: string, businessId: ID) {
  return `${BASE_KEY}:${userId}:${businessId}`;
}

async function readList(userId: string, businessId: ID): Promise<Sale[]> {
  const raw = await AsyncStorage.getItem(keyFor(userId, businessId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Sale[];
  } catch {
    return [];
  }
}

async function writeList(userId: string, businessId: ID, items: Sale[]) {
  await AsyncStorage.setItem(keyFor(userId, businessId), JSON.stringify(items));
}

function sortDesc(items: Sale[]) {
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const salesService = {
  async listSales(userId: string, businessId: ID): Promise<Sale[]> {
    const sales = await readList(userId, businessId);
    return sortDesc(sales);
  },

  async createSale(
    userId: string,
    businessId: ID,
    input: Omit<Sale, "id" | "createdAt">,
  ): Promise<Sale> {
    const created: Sale = {
      id: `sale-${uid()}` as ID,
      createdAt: new Date().toISOString(),
      ...input,
      businessId, // aseguramos consistencia
    };

    const list = await readList(userId, businessId);
    const next = [created, ...list];
    await writeList(userId, businessId, next);
    return created;
  },

  async deleteSale(userId: string, businessId: ID, id: ID): Promise<void> {
    const list = await readList(userId, businessId);
    const next = list.filter((s) => s.id !== id);
    await writeList(userId, businessId, next);
  },

  async clear(userId: string, businessId: ID): Promise<void> {
    await writeList(userId, businessId, []);
  },
};
