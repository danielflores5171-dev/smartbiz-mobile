// src/store/reportsStore.ts
import { apiRequest } from "@/src/lib/apiClient";
import { ENV } from "@/src/lib/env"; // ajusta si tu env está en otro path
import { useMemo, useSyncExternalStore } from "react";
import type { ID } from "../types/business";

type ReportsState = {
  loading: boolean;
  error: string | null;

  // guardamos la "data" tal cual viene del backend para no pelear con tipos ahorita
  salesReport: any | null;
  inventoryReport: any | null;

  lastCsvUrl: string | null;
};

let state: ReportsState = {
  loading: false,
  error: null,
  salesReport: null,
  inventoryReport: null,
  lastCsvUrl: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setState(patch: Partial<ReportsState>) {
  state = { ...state, ...patch };
  emit();
}
function getState() {
  return state;
}

async function tryApi<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

function baseUrlForCsv() {
  // Preferimos el mismo base URL de tu apiClient/env
  const base = (ENV as any)?.API_BASE_URL ?? "";
  return String(base).replace(/\/+$/, "");
}

export const reportsActions = {
  clearLocalMemoryOnly() {
    setState({
      loading: false,
      error: null,
      salesReport: null,
      inventoryReport: null,
      lastCsvUrl: null,
    });
  },

  /**
   * GET /api/reports/sales
   */
  async fetchSalesReport(businessId: ID | null, token?: string | null) {
    setState({ loading: true, error: null });

    if (!token) {
      setState({ loading: false, error: "Falta token para reportes." });
      return null;
    }

    const res = await tryApi(() =>
      apiRequest<any>("/api/reports/sales", {
        method: "GET",
        token,
        businessId: businessId ? String(businessId) : null,
      }),
    );

    if (!res) {
      setState({
        loading: false,
        error: "No se pudo cargar reporte de ventas.",
      });
      return null;
    }

    setState({ loading: false, error: null, salesReport: (res as any).data });
    return (res as any).data;
  },

  /**
   * GET /api/reports/inventory
   */
  async fetchInventoryReport(businessId: ID | null, token?: string | null) {
    setState({ loading: true, error: null });

    if (!token) {
      setState({ loading: false, error: "Falta token para reportes." });
      return null;
    }

    const res = await tryApi(() =>
      apiRequest<any>("/api/reports/inventory", {
        method: "GET",
        token,
        businessId: businessId ? String(businessId) : null,
      }),
    );

    if (!res) {
      setState({
        loading: false,
        error: "No se pudo cargar reporte de inventario.",
      });
      return null;
    }

    setState({
      loading: false,
      error: null,
      inventoryReport: (res as any).data,
    });
    return (res as any).data;
  },

  /**
   * URL para exportar CSV (no hacemos fetch aquí).
   * GET /api/reports/exports/sales.csv
   */
  getSalesCsvUrl(businessId: ID | null) {
    const base = baseUrlForCsv();
    if (!base) {
      setState({ error: "No hay API_BASE_URL configurada para exportar CSV." });
      return null;
    }

    const url =
      base +
      "/api/reports/exports/sales.csv" +
      (businessId
        ? `?businessId=${encodeURIComponent(String(businessId))}`
        : "");

    setState({ lastCsvUrl: url, error: null });
    return url;
  },
};

export function useReportsStore<T>(selector: (s: ReportsState) => T): T {
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
