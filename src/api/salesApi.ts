// src/api/salesApi.ts
import { del, get, post } from "./http";
import type { ID } from "./types";

export type ApiSaleListItem = {
  id: string;
  folio: string;
  status: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  cash_received: string | null;
  cash_change: string | null;
  created_by: string;
  created_at: string;
};

export type ApiSaleDetail = {
  id: string;
  folio: string;
  status: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  cash_received: string | null;
  cash_change: string | null;
  created_at: string;
};

export type ApiSaleDetailItem = {
  id: string;
  product_id: string;
  name: string;
  qty: string;
  unit_price: string;
  unit_cost: string;
  line_total: string;
};

export const salesApi = {
  list: (token: string, businessId: ID) =>
    get<{
      page: number;
      page_size: number;
      total: number;
      items: ApiSaleListItem[];
    }>("/api/sales", {
      token,
      businessId: String(businessId),
    }),

  summary: (token: string, businessId: ID) =>
    get<{
      total_sales: string;
      count: number;
      top_products: Array<{ product_id: string; qty: string }>;
    }>("/api/sales/summary", {
      token,
      businessId: String(businessId),
    }),

  detail: (token: string, businessId: ID, saleId: ID) =>
    get<{
      sale: ApiSaleDetail;
      items: ApiSaleDetailItem[];
    }>(`/api/sales/${saleId}`, {
      token,
      businessId: String(businessId),
    }),

  create: (
    token: string,
    businessId: ID,
    body: {
      discount?: number;
      tax_pct?: number;
      cash_received?: number;
      items: Array<{
        product_id: string;
        qty: number;
        unit_price?: number | null;
      }>;
    },
  ) =>
    post<{
      sale: {
        id: string;
        folio: string;
        subtotal: number;
        discount: number;
        tax: number;
        total: number;
        created_at: string;
      };
    }>("/api/sales", body, {
      token,
      businessId: String(businessId),
    }),

  remove: (token: string, businessId: ID, saleId: ID) =>
    del<{}>(`/api/sales/${saleId}`, {
      token,
      businessId: String(businessId),
    }),
};
