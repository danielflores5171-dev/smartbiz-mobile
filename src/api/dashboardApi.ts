// src/api/dashboardApi.ts
import { get } from "./http";
import type { ID } from "./types";

export type ApiDashboardPerms = {
  role: "owner" | "admin" | "manager" | "cashier" | "viewer";
  can_sales: boolean;
  can_inventory: boolean;
  can_employees: boolean;
  can_reports: boolean;
};

export type ApiDashboardKpis = {
  sales_today: number;
  sales_month: number;
  orders_month: number;
  products_count: number;
  employees_count: number;
  low_stock_count: number;
  gross_profit_month?: number;
};

export type ApiDashboardRecentSale = {
  id: string;
  created_at: string;
  total: number;
  folio?: string | null;
};

export type ApiDashboardLowStockItem = {
  product_id: string;
  name: string;
  stock: number;
  min_stock?: number | null;
};

export type ApiDashboardTsPoint = {
  date: string;
  total: number;
};

export type ApiDashboardCharts = {
  last7d: ApiDashboardTsPoint[];
  last30d: ApiDashboardTsPoint[];
  last12m: ApiDashboardTsPoint[];
};

export type ApiDashboardHome = {
  perms: ApiDashboardPerms;
  kpis: ApiDashboardKpis;
  recent_sales: ApiDashboardRecentSale[];
  low_stock: ApiDashboardLowStockItem[];
  charts: ApiDashboardCharts;
  debug?: {
    business_id?: string;
    role?: string;
    employees_table?: string | null;
    min_stock_column?: string | null;
    membership_table?: string | null;
  };
};

export const dashboardApi = {
  home: (token: string, businessId: ID) =>
    get<ApiDashboardHome>("/api/dashboard/home", {
      token,
      businessId,
    }),
};
