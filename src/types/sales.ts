// src/types/sales.ts
import type { ID } from "./business";
import type { Unit } from "./inventory";

export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export type CartItem = {
  productId: string;
  name: string;
  unit: Unit;
  price: number; // precio venta unitario
  sku?: string;
  barcode?: string;
  qty: number;
};

export type Sale = {
  id: ID;
  businessId: ID;

  items: CartItem[];

  subtotal: number; // suma líneas
  discount: number; // monto fijo (pesos)
  taxableBase: number; // subtotal - discount
  taxRate: number; // 0.16 por ahora
  taxAmount: number; // taxableBase * taxRate
  total: number; // taxableBase + taxAmount

  paymentMethod: PaymentMethod;
  paid: number; // cuánto pagó el cliente
  change: number; // cambio

  note?: string;
  createdAt: string;
};
