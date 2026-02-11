// context/theme-context.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  settingsActions,
  useSettingsStore,
  type ThemeMode as StoreThemeMode,
} from "@/src/store/settingsStore";

export type ThemeMode = "normal" | "light" | "dark";
export type Theme = "light" | "dark";

export type ThemeSemantic = {
  dangerSolidBg: string;
  dangerSolidBgPressed: string;
  dangerSolidText: string;
};

export type ThemeColors = {
  mode: ThemeMode;

  screenBg: string;
  gradient: readonly [string, string, string];

  card: string;
  card2: string;
  border: string;
  divider: string;

  text: string;
  muted: string;
  icon: string;

  accent: string;
  accentPressed: string;
  accentSoft: string;

  pillBg: string;
  pillBgActive: string;

  buttonPrimaryBg: string;
  buttonPrimaryBgPressed: string;
  buttonPrimaryText: string;

  buttonSecondaryBg: string;
  buttonSecondaryBgPressed: string;
  buttonSecondaryText: string;
  buttonSecondaryBorder: string;

  buttonGhostBgPressed: string;
  buttonGhostText: string;
  buttonGhostBorder: string;

  successBg: string;
  dangerBg: string;

  inputBg: string;
  inputBgEmphasis: string;
  inputBorderEmphasis: string;

  dangerBorder: string;
  dangerText: string;

  successBorder: string;
  successText: string;

  semantic: ThemeSemantic;
};

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  setModePersist: (m: ThemeMode) => void;

  theme: Theme;
  isDark: boolean;

  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function makeColors(mode: ThemeMode): ThemeColors {
  const accent = "#2563eb";
  const accentPressed = "#1d4ed8";

  // ---------- LIGHT ----------
  if (mode === "light") {
    return {
      mode,
      screenBg: "#ffffff",
      gradient: ["#ffffff", "#f3f5ff", "#ffffff"],

      card: "#f1f5f9",
      card2: "#ffffff",
      border: "rgba(15,23,42,0.14)",
      divider: "rgba(15,23,42,0.10)",

      text: "#0f172a",
      muted: "rgba(15,23,42,0.68)",
      icon: "#0f172a",

      accent,
      accentPressed,
      accentSoft: "rgba(37,99,235,0.12)",

      pillBg: "rgba(15,23,42,0.10)",
      pillBgActive: "rgba(37,99,235,0.18)",

      buttonPrimaryBg: accent,
      buttonPrimaryBgPressed: accentPressed,
      buttonPrimaryText: "#ffffff",

      buttonSecondaryBg: "rgba(37,99,235,0.16)",
      buttonSecondaryBgPressed: "rgba(37,99,235,0.22)",
      buttonSecondaryText: "#0f172a",
      buttonSecondaryBorder: "rgba(37,99,235,0.35)",

      buttonGhostBgPressed: "rgba(15,23,42,0.06)",
      buttonGhostText: "#0f172a",
      buttonGhostBorder: "rgba(15,23,42,0.14)",

      successBg: "rgba(34,197,94,0.22)",
      dangerBg: "rgba(239,68,68,0.18)",

      inputBg: "#f1f5f9",
      inputBgEmphasis: "#ffffff",
      inputBorderEmphasis: "rgba(37,99,235,0.40)",

      dangerBorder: "rgba(239,68,68,0.40)",
      dangerText: "#991b1b",

      successBorder: "rgba(34,197,94,0.35)",
      successText: "#14532d",

      semantic: {
        dangerSolidBg: "#dc2626",
        dangerSolidBgPressed: "#b91c1c",
        dangerSolidText: "#ffffff",
      },
    };
  }

  // ---------- DARK ----------
  if (mode === "dark") {
    return {
      mode,
      screenBg: "#020617",
      gradient: ["#040814", "#071a33", "#040814"],

      card: "rgba(255,255,255,0.06)",
      card2: "rgba(255,255,255,0.04)",
      border: "rgba(255,255,255,0.12)",
      divider: "rgba(255,255,255,0.10)",

      text: "#ffffff",
      muted: "rgba(226,232,240,0.82)",
      icon: "#e2e8f0",

      accent,
      accentPressed,
      accentSoft: "rgba(37,99,235,0.18)",

      pillBg: "rgba(255,255,255,0.06)",
      pillBgActive: "rgba(37,99,235,0.35)",

      buttonPrimaryBg: accent,
      buttonPrimaryBgPressed: accentPressed,
      buttonPrimaryText: "#ffffff",

      buttonSecondaryBg: "rgba(37,99,235,0.22)",
      buttonSecondaryBgPressed: "rgba(37,99,235,0.30)",
      buttonSecondaryText: "#ffffff",
      buttonSecondaryBorder: "rgba(37,99,235,0.55)",

      buttonGhostBgPressed: "rgba(255,255,255,0.06)",
      buttonGhostText: "#ffffff",
      buttonGhostBorder: "rgba(255,255,255,0.14)",

      successBg: "rgba(34,197,94,0.18)",
      dangerBg: "rgba(239,68,68,0.18)",

      inputBg: "rgba(255,255,255,0.06)",
      inputBgEmphasis: "rgba(255,255,255,0.04)",
      inputBorderEmphasis: "rgba(37,99,235,0.55)",

      dangerBorder: "rgba(239,68,68,0.45)",
      dangerText: "#fecaca",

      successBorder: "rgba(34,197,94,0.35)",
      successText: "#bbf7d0",

      semantic: {
        dangerSolidBg: "#ef4444",
        dangerSolidBgPressed: "#dc2626",
        dangerSolidText: "#ffffff",
      },
    };
  }

  // ---------- NORMAL (tu tema principal) ----------
  // ✅ Mantén contraste similar a dark, pero con screenBg propio.
  // ✅ Punto 4 aplicado: inputBorderEmphasis usa ACCENT (para focus/selección).
  return {
    mode,
    screenBg: "#0b1220",
    gradient: ["#0b1220", "#0b1220", "#0b1220"],

    card: "rgba(255,255,255,0.06)",
    card2: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.12)",
    divider: "rgba(255,255,255,0.10)",

    text: "#ffffff",
    muted: "rgba(226,232,240,0.82)",
    icon: "#e2e8f0",

    accent,
    accentPressed,
    accentSoft: "rgba(37,99,235,0.20)",

    pillBg: "rgba(255,255,255,0.06)",
    pillBgActive: "rgba(37,99,235,0.22)",

    buttonPrimaryBg: accent,
    buttonPrimaryBgPressed: accentPressed,
    buttonPrimaryText: "#ffffff",

    buttonSecondaryBg: "rgba(255,255,255,0.08)",
    buttonSecondaryBgPressed: "rgba(255,255,255,0.12)",
    buttonSecondaryText: "#ffffff",
    buttonSecondaryBorder: "rgba(255,255,255,0.14)",

    buttonGhostBgPressed: "rgba(255,255,255,0.06)",
    buttonGhostText: "#ffffff",
    buttonGhostBorder: "rgba(255,255,255,0.14)",

    successBg: "rgba(34,197,94,0.18)",
    dangerBg: "rgba(239,68,68,0.18)",

    inputBg: "rgba(255,255,255,0.06)",
    inputBgEmphasis: "rgba(255,255,255,0.04)",

    // ✅ AQUÍ está el cambio del punto 4:
    // antes: "rgba(255,255,255,0.14)"
    inputBorderEmphasis: "rgba(37,99,235,0.45)",

    dangerBorder: "rgba(239,68,68,0.42)",
    dangerText: "#fecaca",

    successBorder: "rgba(34,197,94,0.30)",
    successText: "#bbf7d0",

    semantic: {
      dangerSolidBg: "#ef4444",
      dangerSolidBgPressed: "#dc2626",
      dangerSolidText: "#ffffff",
    },
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("normal");

  const hydrated = useSettingsStore((s) => s.hydrated);
  const themeMode = useSettingsStore((s) => s.themeMode);

  useEffect(() => {
    void settingsActions.bootstrap();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const safe: StoreThemeMode =
      themeMode === "light" || themeMode === "dark" || themeMode === "normal"
        ? themeMode
        : "normal";

    setMode(safe);
  }, [hydrated, themeMode]);

  const colors = useMemo(() => makeColors(mode), [mode]);

  // Nota: normal lo trato como oscuro (porque visualmente es oscuro)
  const theme: Theme = mode === "light" ? "light" : "dark";
  const isDark = mode === "dark" || mode === "normal";

  const setModePersist = (m: ThemeMode) => {
    settingsActions.setThemeMode(m);
    setMode(m);
  };

  const value = useMemo(
    () => ({ mode, setMode, setModePersist, theme, isDark, colors }),
    [mode, theme, isDark, colors],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
