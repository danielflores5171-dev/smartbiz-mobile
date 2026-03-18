// src/store/reportsStore.ts
import { apiRequest } from "@/src/lib/apiClient";
import { ENV } from "@/src/lib/env";
import { useMemo, useSyncExternalStore } from "react";
import type { ID } from "../types/business";

type ReportsState = {
  loading: boolean;
  error: string | null;

  salesReport: any | null;
  inventoryReport: any | null;
  statisticsSummary: any | null;

  lastCsvUrl: string | null;
};

let state: ReportsState = {
  loading: false,
  error: null,
  salesReport: null,
  inventoryReport: null,
  statisticsSummary: null,
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

function baseUrlForApi() {
  const base = (ENV as any)?.API_BASE_URL ?? "";
  return String(base).replace(/\/+$/, "");
}

function qsFromParams(params: Record<string, string | null | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && String(v).trim() !== "") {
      qs.set(k, String(v));
    }
  }
  return qs.toString();
}

export const reportsActions = {
  clearLocalMemoryOnly() {
    setState({
      loading: false,
      error: null,
      salesReport: null,
      inventoryReport: null,
      statisticsSummary: null,
      lastCsvUrl: null,
    });
  },

  async fetchStatisticsSummary(
    businessId: ID | null,
    token?: string | null,
    range: "today" | "7d" | "month" = "month",
  ) {
    console.log(
      "[reportsStore.fetchStatisticsSummary] businessId=",
      businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
      "range=",
      range,
    );

    setState({ loading: true, error: null });

    if (!token) {
      setState({
        loading: false,
        error: "Falta token para estadísticas.",
      });
      return null;
    }

    const path =
      "/api/statistics/summary?" +
      qsFromParams({
        range,
        businessId: businessId ? String(businessId) : null,
      });

    const res = await tryApi(
      () =>
        apiRequest<any>(path, {
          method: "GET",
          token,
        }),
      "statisticsApi.summary",
    );

    if (!res) {
      setState({
        loading: false,
        error: "No se pudo cargar resumen de estadísticas.",
      });
      return null;
    }

    setState({
      loading: false,
      error: null,
      statisticsSummary: (res as any).data,
    });
    return (res as any).data;
  },

  async fetchSalesReport(
    businessId: ID | null,
    token?: string | null,
    opts?: {
      range?: "today" | "7d" | "month" | "";
      from?: string | null;
      to?: string | null;
    },
  ) {
    console.log(
      "[reportsStore.fetchSalesReport] businessId=",
      businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
      "range=",
      opts?.range ?? "month",
      "from=",
      opts?.from ?? "",
      "to=",
      opts?.to ?? "",
    );

    setState({ loading: true, error: null });

    if (!token) {
      setState({ loading: false, error: "Falta token para reportes." });
      return null;
    }

    const query = qsFromParams({
      range: opts?.range ?? "month",
      from: opts?.from ?? null,
      to: opts?.to ?? null,
      businessId: businessId ? String(businessId) : null,
    });

    const res = await tryApi(
      () =>
        apiRequest<any>(`/api/reports/sales?${query}`, {
          method: "GET",
          token,
        }),
      "reportsApi.sales",
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

  async fetchInventoryReport(
    businessId: ID | null,
    token?: string | null,
    opts?: {
      range?: "today" | "7d" | "month" | "";
      from?: string | null;
      to?: string | null;
    },
  ) {
    console.log(
      "[reportsStore.fetchInventoryReport] businessId=",
      businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
      "range=",
      opts?.range ?? "month",
      "from=",
      opts?.from ?? "",
      "to=",
      opts?.to ?? "",
    );

    setState({ loading: true, error: null });

    if (!token) {
      setState({ loading: false, error: "Falta token para reportes." });
      return null;
    }

    const query = qsFromParams({
      range: opts?.range ?? "month",
      from: opts?.from ?? null,
      to: opts?.to ?? null,
      businessId: businessId ? String(businessId) : null,
    });

    const res = await tryApi(
      () =>
        apiRequest<any>(`/api/reports/inventory?${query}`, {
          method: "GET",
          token,
        }),
      "reportsApi.inventory",
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

  getSalesCsvUrl(
    businessId: ID | null,
    opts?: {
      range?: "today" | "7d" | "month" | "";
      from?: string | null;
      to?: string | null;
    },
  ) {
    const base = baseUrlForApi();
    if (!base) {
      setState({ error: "No hay API_BASE_URL configurada para exportar CSV." });
      return null;
    }

    const query = qsFromParams({
      range: opts?.range ?? "month",
      from: opts?.from ?? null,
      to: opts?.to ?? null,
      businessId: businessId ? String(businessId) : null,
    });

    const url = `${base}/api/reports/exports/sales.csv${
      query ? `?${query}` : ""
    }`;

    console.log(
      "[reportsStore.getSalesCsvUrl] businessId=",
      businessId,
      "url=",
      url,
    );

    setState({ lastCsvUrl: url, error: null });
    return url;
  },

  async downloadSalesCsv(
    businessId: ID | null,
    token?: string | null,
    opts?: {
      range?: "today" | "7d" | "month" | "";
      from?: string | null;
      to?: string | null;
    },
  ) {
    const base = baseUrlForApi();

    console.log(
      "[reportsStore.downloadSalesCsv] businessId=",
      businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
      "range=",
      opts?.range ?? "month",
      "from=",
      opts?.from ?? "",
      "to=",
      opts?.to ?? "",
    );

    if (!base) {
      const msg = "No hay API_BASE_URL configurada para exportar CSV.";
      setState({ error: msg });
      return null;
    }

    if (!token) {
      const msg = "Falta token para descargar CSV.";
      setState({ error: msg });
      return null;
    }

    const query = qsFromParams({
      range: opts?.range ?? "month",
      from: opts?.from ?? null,
      to: opts?.to ?? null,
      businessId: businessId ? String(businessId) : null,
    });

    const url = `${base}/api/reports/exports/sales.csv${
      query ? `?${query}` : ""
    }`;

    try {
      console.log(
        "[reportsStore.downloadSalesCsv] CALL url=",
        url,
        "tokenHead=",
        String(token ?? "").slice(0, 10),
      );

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/csv,application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      if (!res.ok) {
        console.log(
          "[reportsStore.downloadSalesCsv] FAIL ->",
          text?.slice(0, 250) || `HTTP ${res.status}`,
        );
        setState({
          error: `No se pudo descargar CSV. (${res.status})`,
        });
        return null;
      }

      console.log("[reportsStore.downloadSalesCsv] OK bytes=", text.length);

      setState({ error: null, lastCsvUrl: url });

      return {
        text,
        url,
      };
    } catch (e) {
      console.log("[reportsStore.downloadSalesCsv] FAIL ->", String(e));
      setState({ error: "No se pudo descargar CSV." });
      return null;
    }
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
