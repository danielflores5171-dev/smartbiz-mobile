// src/store/dashboardStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";

import {
    dashboardApi,
    type ApiDashboardCharts,
    type ApiDashboardHome,
    type ApiDashboardKpis,
    type ApiDashboardLowStockItem,
    type ApiDashboardPerms,
    type ApiDashboardRecentSale,
} from "@/src/api/dashboardApi";
import type { ID } from "@/src/types/business";

type DashboardHomeData = {
  kpis: ApiDashboardKpis;
  charts: ApiDashboardCharts;
  recentSales: ApiDashboardRecentSale[];
  lowStock: ApiDashboardLowStockItem[];
  perms: ApiDashboardPerms;
  fetchedAt: string;
  source: "api" | "cache";
};

type State = {
  userId: string | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  byBusiness: Record<string, DashboardHomeData>;
};

const BASE_KEY = "smartbiz.dashboardStore.v1";
const keyForUser = (userId: string) => `${BASE_KEY}:${userId}`;

const state: State = {
  userId: null,
  hydrated: false,
  loading: false,
  error: null,
  byBusiness: {},
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function getState() {
  return state;
}

function setState(patch: Partial<State>, opts?: { skipPersist?: boolean }) {
  Object.assign(state, patch);
  emit();
  if (!opts?.skipPersist) persist();
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let bootstrapInFlight = false;

async function persistNow() {
  const s = getState();
  if (!s.hydrated) return;
  if (!s.userId) return;

  await AsyncStorage.setItem(
    keyForUser(s.userId),
    JSON.stringify({
      byBusiness: s.byBusiness,
    }),
  );
}

function persist() {
  const s = getState();
  if (!s.hydrated) return;
  if (!s.userId) return;

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      await persistNow();
    } catch {
      // silencioso
    }
  }, 150);
}

async function flush() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  try {
    await persistNow();
  } catch {
    // silencioso
  }
}

async function hydrateForUser(userId: string) {
  const raw = await AsyncStorage.getItem(keyForUser(userId));

  if (!raw) {
    setState(
      {
        userId,
        hydrated: true,
        loading: false,
        error: null,
        byBusiness: {},
      },
      { skipPersist: true },
    );
    return;
  }

  try {
    const parsed = JSON.parse(raw) as any;
    setState(
      {
        userId,
        hydrated: true,
        loading: false,
        error: null,
        byBusiness: parsed?.byBusiness ?? {},
      },
      { skipPersist: true },
    );
  } catch {
    setState(
      {
        userId,
        hydrated: true,
        loading: false,
        error: null,
        byBusiness: {},
      },
      { skipPersist: true },
    );
  }
}

function requireUserId() {
  const uid = getState().userId;
  if (!uid) {
    throw new Error("No hay usuario para dashboard. (Falta bootstrap)");
  }
  return uid;
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

function mapApiHomeToDashboardHomeData(
  raw: ApiDashboardHome,
): DashboardHomeData {
  return {
    kpis: {
      sales_today: Number(raw?.kpis?.sales_today ?? 0),
      sales_month: Number(raw?.kpis?.sales_month ?? 0),
      orders_month: Number(raw?.kpis?.orders_month ?? 0),
      products_count: Number(raw?.kpis?.products_count ?? 0),
      employees_count: Number(raw?.kpis?.employees_count ?? 0),
      low_stock_count: Number(raw?.kpis?.low_stock_count ?? 0),
      gross_profit_month:
        raw?.kpis?.gross_profit_month != null
          ? Number(raw.kpis.gross_profit_month)
          : 0,
    },
    charts: {
      last7d: Array.isArray(raw?.charts?.last7d) ? raw.charts.last7d : [],
      last30d: Array.isArray(raw?.charts?.last30d) ? raw.charts.last30d : [],
      last12m: Array.isArray(raw?.charts?.last12m) ? raw.charts.last12m : [],
    },
    recentSales: Array.isArray(raw?.recent_sales) ? raw.recent_sales : [],
    lowStock: Array.isArray(raw?.low_stock) ? raw.low_stock : [],
    perms: raw?.perms ?? {
      role: "viewer",
      can_sales: false,
      can_inventory: false,
      can_employees: false,
      can_reports: false,
    },
    fetchedAt: new Date().toISOString(),
    source: "api",
  };
}

export const dashboardActions = {
  async bootstrap(userId?: string) {
    console.log("[dashboardStore.bootstrap] userId=", userId);

    if (bootstrapInFlight) {
      console.log("[dashboardStore.bootstrap] skip: bootstrap en curso");
      return;
    }

    if (!userId) {
      if (!getState().hydrated) {
        setState({ hydrated: true }, { skipPersist: true });
      }
      console.log("[dashboardStore.bootstrap] skip: no userId");
      return;
    }

    if (getState().hydrated && getState().userId === userId) {
      console.log(
        "[dashboardStore.bootstrap] skip: ya hidratado para este usuario",
      );
      return;
    }

    bootstrapInFlight = true;

    try {
      setState(
        {
          userId,
          hydrated: false,
          loading: true,
          error: null,
          byBusiness: {},
        },
        { skipPersist: true },
      );

      await hydrateForUser(userId);
      setState({ loading: false, hydrated: true });
      await flush();
    } finally {
      bootstrapInFlight = false;
    }
  },

  clearLocalMemoryOnly() {
    setState(
      {
        userId: null,
        hydrated: false,
        loading: false,
        error: null,
        byBusiness: {},
      },
      { skipPersist: true },
    );
  },

  async clearLocalAndStorage() {
    const uid = getState().userId;
    this.clearLocalMemoryOnly();

    if (uid) {
      try {
        await AsyncStorage.removeItem(keyForUser(uid));
      } catch {
        // demo
      }
    }
  },

  async flush() {
    await flush();
  },

  async loadHome(businessId: ID, token?: string | null) {
    console.log(
      "[dashboardStore.loadHome] businessId=",
      businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    requireUserId();
    setState({ loading: true, error: null });

    if (token) {
      const apiRes = await tryApi(
        () => dashboardApi.home(token, businessId),
        "dashboardApi.home",
      );

      const raw = (apiRes as any)?.data as ApiDashboardHome | undefined;

      if (raw?.kpis && raw?.charts) {
        const mapped = mapApiHomeToDashboardHomeData(raw);

        setState({
          byBusiness: {
            ...getState().byBusiness,
            [String(businessId)]: mapped,
          },
          loading: false,
          error: null,
        });

        await flush();

        console.log(
          "[dashboardStore.loadHome] API OK businessId=",
          businessId,
          "role=",
          mapped.perms.role,
        );

        return mapped;
      }
    } else {
      console.log("[dashboardStore.loadHome] no token, skipping API");
    }

    console.log("[dashboardStore.loadHome] fallback cache/demo");

    const cached = getState().byBusiness[String(businessId)] ?? null;

    setState({
      loading: false,
      error: token ? "Dashboard API no autorizó; usando fallback local." : null,
    });

    return cached;
  },

  getHome(businessId: ID) {
    return getState().byBusiness[String(businessId)] ?? null;
  },
};

export function useDashboardStore<T>(selector: (s: State) => T): T {
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
