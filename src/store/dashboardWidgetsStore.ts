import AsyncStorage from "@react-native-async-storage/async-storage";
import { create, type StateCreator } from "zustand";

export type DashboardWidgetKey =
  | "tp_revenue"
  | "tp_qty"
  | "sp_total_by_day"
  | "sp_count_by_day";

export type DashboardWidgetsEnabled = Record<DashboardWidgetKey, boolean>;

type StoreState = {
  enabled: DashboardWidgetsEnabled;
  hydrated: boolean;

  toggle: (k: DashboardWidgetKey) => void;
  setEnabled: (k: DashboardWidgetKey, v: boolean) => void;

  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
};

const STORAGE_KEY = "smartbiz.dashboardWidgets.v1";

const defaultEnabled: Record<DashboardWidgetKey, boolean> = {
  tp_revenue: true,
  tp_qty: true,
  sp_total_by_day: true,
  sp_count_by_day: true,
};

// ✅ Tipamos el creator explícitamente (evita any en set/get)
const creator: StateCreator<StoreState> = (set, get) => ({
  enabled: defaultEnabled,
  hydrated: false,

  toggle: (k: DashboardWidgetKey) => {
    set((prev) => ({
      enabled: { ...prev.enabled, [k]: !prev.enabled[k] },
    }));
  },

  setEnabled: (k: DashboardWidgetKey, v: boolean) => {
    set((prev) => ({
      enabled: { ...prev.enabled, [k]: v },
    }));
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          enabled: DashboardWidgetsEnabled;
        }>;
        if (parsed?.enabled) {
          set({ enabled: { ...defaultEnabled, ...parsed.enabled } });
        }
      }
    } catch {
      // ignore
    } finally {
      set({ hydrated: true });
    }
  },

  persist: async () => {
    try {
      const { enabled } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled }));
    } catch {
      // ignore
    }
  },
});

export const useDashboardWidgetsStore = create<StoreState>(creator);

// Helpers opcionales
export async function hydrateDashboardWidgets() {
  await useDashboardWidgetsStore.getState().hydrate();
}

export async function persistDashboardWidgets() {
  await useDashboardWidgetsStore.getState().persist();
}
