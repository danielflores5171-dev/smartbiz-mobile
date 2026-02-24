// src/types/inventory.ts
import type { ID } from "./business";

export type Unit = "pz" | "kg" | "lt" | "caja";

export type ProductStatus = "active" | "archived";

export type Product = {
  id: ID;
  businessId: ID;

  name: string;
  sku?: string;
  barcode?: string;

  unit: Unit;

  price: number; // venta
  cost: number; // costo
  stock: number;
  minStock?: number;

  // ✅ IMAGENES (demo/local + futuro backend)
  imageUri?: string; // local file uri (FileSystem.documentDirectory...)
  imageUrl?: string; // remoto (Supabase Storage / CDN) - futuro

  status: ProductStatus;

  createdAt: string;
  updatedAt: string;
};

export type StockReason =
  | "Compra / reposición"
  | "Venta"
  | "Merma / caducidad"
  | "Ajuste de inventario"
  | "Devolución"
  | "Otro";

export type StockAdjustment = {
  id: ID;
  businessId: ID;
  productId: ID;
  delta: number;
  reason: StockReason;
  note?: string;
  createdAt: string;
};
