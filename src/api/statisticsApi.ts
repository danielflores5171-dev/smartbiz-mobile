// src/api/statisticsApi.ts
import { apiRequest } from "@/src/lib/apiClient";
import type { ID } from "@/src/types/business";

export type StatisticsRangePreset = "today" | "7d" | "month";

type StatisticsQuery = {
  businessId?: ID | null;
  range?: StatisticsRangePreset | null;
};

function buildQuery(params?: StatisticsQuery) {
  const qs = new URLSearchParams();

  if (params?.range) qs.set("range", String(params.range));

  const out = qs.toString();
  return out ? `?${out}` : "";
}

export const statisticsApi = {
  async summary(token: string, params?: StatisticsQuery) {
    console.log(
      "[statisticsApi.summary] CALL tokenHead=",
      String(token ?? "").slice(0, 10),
      "businessId=",
      String(params?.businessId ?? ""),
      "range=",
      String(params?.range ?? ""),
    );

    try {
      const res = await apiRequest<any>(
        `/api/statistics/summary${buildQuery(params)}`,
        {
          method: "GET",
          token,
          businessId: params?.businessId ? String(params.businessId) : null,
        },
      );

      console.log("[statisticsApi.summary] OK");
      return res;
    } catch (e) {
      console.log("[statisticsApi.summary] FAIL ->", String(e));
      throw e;
    }
  },

  async series(token: string, businessId: ID) {
    console.log(
      "[statisticsApi.series] CALL tokenHead=",
      String(token ?? "").slice(0, 10),
      "businessId=",
      String(businessId ?? ""),
    );

    try {
      const res = await apiRequest<any>(
        `/api/statistics/series?business_id=${encodeURIComponent(
          String(businessId),
        )}`,
        {
          method: "GET",
          token,
          businessId: String(businessId),
        },
      );

      console.log("[statisticsApi.series] OK");
      return res;
    } catch (e) {
      console.log("[statisticsApi.series] FAIL ->", String(e));
      throw e;
    }
  },
};
