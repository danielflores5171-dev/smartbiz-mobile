// src/store/settingsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";

export type ThemeMode = "normal" | "light" | "dark";

// ✅ aunque el tipo permita varios, el UI y el store se “clavan” a MXN
export type CurrencyCode = "MXN" | "USD" | "EUR";
export type TaxRatePreset = 0.16;

export type DateFormat = "DMY" | "MDY" | "YMD";
export type LocaleCode = "es-MX" | "en-US";
export type TimezoneCode =
  | "America/Mexico_City"
  | "America/Los_Angeles"
  | "UTC";

type State = {
  hydrated: boolean;

  themeMode: ThemeMode;

  currency: CurrencyCode;
  taxRate: TaxRatePreset;

  locale: LocaleCode;
  timezone: TimezoneCode;
  dateFormat: DateFormat;

  systemNotifications: boolean;
};

const STORAGE_KEY = "smartbiz.settingsStore.v1";

const defaults: Omit<State, "hydrated"> = {
  themeMode: "normal",

  currency: "MXN",
  taxRate: 0.16,

  locale: "es-MX",
  timezone: "America/Mexico_City",
  dateFormat: "DMY",

  systemNotifications: true,
};

const state: State = {
  hydrated: false,
  ...defaults,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function getState() {
  return state;
}

function setState(patch: Partial<State>) {
  Object.assign(state, patch);
  emit();
  void persist();
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function persist() {
  if (!getState().hydrated) return;
  if (persistTimer) clearTimeout(persistTimer);

  persistTimer = setTimeout(async () => {
    try {
      const s = getState();

      // ✅ forzamos “solo lo que usas” aunque haya valores viejos
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          themeMode: s.themeMode,
          currency: "MXN",
          taxRate: 0.16,
          locale: "es-MX",
          timezone: "America/Mexico_City",
          dateFormat: "DMY",
          systemNotifications: s.systemNotifications,
        }),
      );
    } catch {
      // no-op
    }
  }, 150);
}

async function hydrate() {
  let raw: string | null = null;

  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    setState({ hydrated: true });
    return;
  }

  if (!raw) {
    setState({ hydrated: true });
    return;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<State>;

    const safeThemeMode: ThemeMode =
      parsed.themeMode === "dark" ||
      parsed.themeMode === "light" ||
      parsed.themeMode === "normal"
        ? parsed.themeMode
        : defaults.themeMode;

    const safeSystemNotifications =
      typeof parsed.systemNotifications === "boolean"
        ? parsed.systemNotifications
        : defaults.systemNotifications;

    // ✅ lo demás queda fijo a MX / ES / CDMX / DMY
    setState({
      hydrated: true,
      themeMode: safeThemeMode,
      currency: "MXN",
      taxRate: 0.16,
      locale: "es-MX",
      timezone: "America/Mexico_City",
      dateFormat: "DMY",
      systemNotifications: safeSystemNotifications,
    });
  } catch {
    setState({ hydrated: true, ...defaults });
  }
}

export const settingsActions = {
  async bootstrap() {
    if (getState().hydrated) return;
    await hydrate();
  },

  setThemeMode(m: ThemeMode) {
    setState({ themeMode: m });
  },

  // ✅ aunque te pasen otra, se queda en MXN
  setCurrency(_: CurrencyCode) {
    setState({ currency: "MXN" });
  },

  setTaxRate(_: number) {
    setState({ taxRate: 0.16 });
  },

  // ✅ fijo ES-MX
  setLocale(_: LocaleCode) {
    setState({ locale: "es-MX" });
  },

  // ✅ fijo CDMX
  setTimezone(_: TimezoneCode) {
    setState({ timezone: "America/Mexico_City" });
  },

  // ✅ fijo DMY
  setDateFormat(_: DateFormat) {
    setState({ dateFormat: "DMY" });
  },

  setSystemNotifications(v: boolean) {
    setState({ systemNotifications: v });
  },
};

export function useSettingsStore<T>(selector: (s: State) => T): T {
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
