import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { useTheme } from "@/context/theme-context";
import {
  DashboardWidgetKey,
  persistDashboardWidgets,
  useDashboardWidgetsStore,
} from "@/src/store/dashboardWidgetsStore";

export type BarPoint = { x: string; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function MiniBarsChartCard({
  title,
  subtitle,
  icon,
  data,
  valueFmt,
  widgetKey,
  height = 200,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  data: BarPoint[];
  valueFmt: (n: number) => string;
  widgetKey: DashboardWidgetKey;
  height?: number;
}) {
  const { colors, mode } = useTheme();
  const isLight = mode === "light";

  const enabled = useDashboardWidgetsStore((s) => s.enabled[widgetKey]);
  const toggle = useDashboardWidgetsStore((s) => s.toggle);

  const [picked, setPicked] = useState<number | null>(null);

  const W = 320;
  const H = height;

  const { maxY, bars } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => Number(d.y ?? 0)));
    const padX = 18;
    const padTop = 12;
    const padBottom = 30;
    const innerW = W - padX * 2;
    const innerH = H - padTop - padBottom;

    const gap = 6;
    const barW =
      data.length > 0
        ? (innerW - gap * (data.length - 1)) / data.length
        : innerW;

    const out = data.map((d, i) => {
      const v = Number(d.y ?? 0);
      const pct = clamp(v / max, 0, 1);
      const h = Math.max(2, innerH * pct);
      const x = padX + i * (barW + gap);
      const y = padTop + (innerH - h);
      return { x, y, w: barW, h, v };
    });

    return { maxY: max, bars: out };
  }, [data, H]);

  const pickedLabel = picked == null ? null : data[picked]?.x;
  const pickedValue = picked == null ? null : data[picked]?.y;

  const chartBg = isLight ? "rgba(2,6,23,0.04)" : "rgba(255,255,255,0.04)";

  return (
    <View
      style={{
        marginTop: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isLight
              ? "rgba(37,99,235,0.10)"
              : "rgba(37,99,235,0.18)",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={async () => {
            toggle(widgetKey);
            await persistDashboardWidgets();
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: enabled ? "rgba(34,197,94,0.18)" : colors.pillBg,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}>
            {enabled ? "EN DASHBOARD" : "AGREGAR"}
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.divider,
          marginVertical: 14,
        }}
      />

      {data.length === 0 ? (
        <Text style={{ color: colors.muted }}>(Sin datos para graficar)</Text>
      ) : (
        <>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {pickedLabel
                ? `Día ${pickedLabel}`
                : "Toca una barra para ver detalle"}
              {"  ·  "}
              <Text style={{ color: colors.text, fontWeight: "900" }}>
                {pickedValue != null ? valueFmt(pickedValue) : valueFmt(maxY)}
              </Text>
            </Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <View
              style={{
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: chartBg,
              }}
            >
              <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                {bars.map((b, i) => (
                  <Rect
                    key={`bar-${i}`}
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    rx={8}
                    ry={8}
                    fill={
                      picked === i
                        ? "rgba(37,99,235,0.95)"
                        : "rgba(37,99,235,0.65)"
                    }
                    onPress={() => setPicked(i)}
                  />
                ))}
              </Svg>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: W,
                marginTop: 6,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                {data[0]?.x ?? ""}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                {data[data.length - 1]?.x ?? ""}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
