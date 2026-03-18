// src/api/reportsApi.ts
import { apiRequest } from "@/src/lib/apiClient";
import type { ID } from "@/src/types/business";

export type ReportRangePreset = "today" | "7d" | "month";

export type ReportsQuery = {
  businessId?: ID | null;
  range?: ReportRangePreset | null;
  from?: string | null;
  to?: string | null;
};

function buildQuery(params?: ReportsQuery) {
  const qs = new URLSearchParams();

  if (params?.range) qs.set("range", String(params.range));
  if (params?.from) qs.set("from", String(params.from));
  if (params?.to) qs.set("to", String(params.to));

  const out = qs.toString();
  return out ? `?${out}` : "";
}

export const reportsApi = {
  async sales(token: string, params?: ReportsQuery) {
    console.log(
      "[reportsApi.sales] CALL tokenHead=",
      String(token ?? "").slice(0, 10),
      "businessId=",
      String(params?.businessId ?? ""),
      "range=",
      String(params?.range ?? ""),
      "from=",
      String(params?.from ?? ""),
      "to=",
      String(params?.to ?? ""),
    );

    try {
      const res = await apiRequest<any>(
        `/api/reports/sales${buildQuery(params)}`,
        {
          method: "GET",
          token,
          businessId: params?.businessId ? String(params.businessId) : null,
        },
      );

      console.log("[reportsApi.sales] OK");
      return res;
    } catch (e) {
      console.log("[reportsApi.sales] FAIL ->", String(e));
      throw e;
    }
  },

  async inventory(token: string, params?: ReportsQuery) {
    console.log(
      "[reportsApi.inventory] CALL tokenHead=",
      String(token ?? "").slice(0, 10),
      "businessId=",
      String(params?.businessId ?? ""),
      "range=",
      String(params?.range ?? ""),
      "from=",
      String(params?.from ?? ""),
      "to=",
      String(params?.to ?? ""),
    );

    try {
      const res = await apiRequest<any>(
        `/api/reports/inventory${buildQuery(params)}`,
        {
          method: "GET",
          token,
          businessId: params?.businessId ? String(params.businessId) : null,
        },
      );

      console.log("[reportsApi.inventory] OK");
      return res;
    } catch (e) {
      console.log("[reportsApi.inventory] FAIL ->", String(e));
      throw e;
    }
  },

  getSalesCsvUrl(params?: ReportsQuery) {
    const qs = buildQuery(params);
    return `/api/reports/exports/sales.csv${qs}`;
  },
};
