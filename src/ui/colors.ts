// src/theme/colors.ts
export type ThemeName = "normal" | "light" | "dark";

export type ThemeColors = {
  background: string;
  gradient: readonly [string, string, string];

  card: string;
  border: string;
  divider: string; // ✅ AGREGA ESTO

  text: string;
  muted: string;

  icon: string;
  accent: string;

  pillBg: string;
  pillBgActive: string;
};

export const THEMES: Record<ThemeName, ThemeColors> = {
  normal: {
    background: "#0b1220",
    gradient: ["#0b1220", "#0b1220", "#0b1220"],

    card: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.12)",
    divider: "rgba(255,255,255,0.10)",

    text: "#ffffff",
    muted: "rgba(226,232,240,0.82)",

    icon: "#e2e8f0",
    accent: "#2563eb",

    pillBg: "rgba(255,255,255,0.06)",
    pillBgActive: "rgba(37,99,235,0.35)",
  },

  light: {
    background: "#ffffff",
    gradient: ["#ffffff", "#f6f7fb", "#ffffff"],

    card: "#f3f4f6",
    border: "rgba(15,23,42,0.12)",
    divider: "rgba(15,23,42,0.10)",

    text: "#0f172a",
    muted: "rgba(15,23,42,0.65)",

    icon: "#0f172a",
    accent: "#2563eb",

    pillBg: "rgba(15,23,42,0.06)",
    pillBgActive: "rgba(37,99,235,0.18)",
  },

  dark: {
    background: "#020617",
    gradient: ["#040814", "#071a33", "#040814"],

    card: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.12)",
    divider: "rgba(255,255,255,0.10)",

    text: "#ffffff",
    muted: "rgba(226,232,240,0.80)",

    icon: "#e2e8f0",
    accent: "#2563eb",

    pillBg: "rgba(255,255,255,0.06)",
    pillBgActive: "rgba(37,99,235,0.35)",
  },
};
