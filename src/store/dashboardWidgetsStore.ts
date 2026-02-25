// src/store/dashboardWidgetsStore.ts
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

  // ✅ userId actual (opcional, para persist automático)
  userId: string | null;

  toggle: (k: DashboardWidgetKey) => void;
  setEnabled: (k: DashboardWidgetKey, v: boolean) => void;

  hydrate: (userId?: string) => Promise<void>;
  bootstrap: (userId?: string) => Promise<void>; // ✅ NUEVO alias (consistencia)
  persist: () => Promise<void>;
  clearLocalMemoryOnly: () => void;
};

const BASE_KEY = "smartbiz.dashboardWidgets.v2";

function keyForUser(userId: string) {
  return `${BASE_KEY}:${userId}`;
}

const defaultEnabled: Record<DashboardWidgetKey, boolean> = {
  tp_revenue: true,
  tp_qty: true,
  sp_total_by_day: true,
  sp_count_by_day: true,
};

const creator: StateCreator<StoreState> = (set, get) => ({
  enabled: defaultEnabled,
  hydrated: false,
  userId: null,

  toggle: (k: DashboardWidgetKey) => {
    set((prev) => ({
      enabled: { ...prev.enabled, [k]: !prev.enabled[k] },
    }));
    void get().persist();
  },

  setEnabled: (k: DashboardWidgetKey, v: boolean) => {
    set((prev) => ({
      enabled: { ...prev.enabled, [k]: v },
    }));
    void get().persist();
  },

  hydrate: async (userId?: string) => {
    // compat: si no pasan userId, solo hidratamos defaults (no compartimos)
    if (!userId) {
      set({ enabled: defaultEnabled, hydrated: true, userId: null });
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(keyForUser(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<{
          enabled: DashboardWidgetsEnabled;
        }>;
        if (parsed?.enabled) {
          set({ enabled: { ...defaultEnabled, ...parsed.enabled } });
        } else {
          set({ enabled: defaultEnabled });
        }
      } else {
        set({ enabled: defaultEnabled });
      }
    } catch {
      set({ enabled: defaultEnabled });
    } finally {
      set({ hydrated: true, userId });
    }
  },

  // ✅ NUEVO: alias para consistencia con otros stores
  bootstrap: async (userId?: string) => {
    await get().hydrate(userId);
  },

  persist: async () => {
    const { enabled, userId, hydrated } = get();
    if (!hydrated) return;
    if (!userId) return;
    try {
      await AsyncStorage.setItem(
        keyForUser(userId),
        JSON.stringify({ enabled }),
      );
    } catch {
      // ignore
    }
  },

  clearLocalMemoryOnly: () => {
    set({ enabled: defaultEnabled, hydrated: false, userId: null });
  },
});

export const useDashboardWidgetsStore = create<StoreState>(creator);

// Helpers opcionales
export async function hydrateDashboardWidgets(userId?: string) {
  await useDashboardWidgetsStore.getState().hydrate(userId);
}

export async function persistDashboardWidgets() {
  await useDashboardWidgetsStore.getState().persist();
}
