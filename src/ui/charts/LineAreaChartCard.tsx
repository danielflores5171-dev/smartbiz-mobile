import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { useTheme } from "@/context/theme-context";
import {
  DashboardWidgetKey,
  persistDashboardWidgets,
  useDashboardWidgetsStore,
} from "@/src/store/dashboardWidgetsStore";

export type LinePoint = { x: string; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const midX = (prev.x + cur.x) / 2;
    const midY = (prev.y + cur.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

export default function LineAreaChartCard({
  title,
  subtitle,
  icon,
  data,
  valueFmt,
  widgetKey,
  height = 220,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  data: LinePoint[];
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

  // ✅ id único por card para evitar colisiones
  const gradId = useMemo(() => `areaGrad_${widgetKey}`, [widgetKey]);

  const { pts, path, areaPath, maxY } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        pts: [] as { x: number; y: number }[],
        path: "",
        areaPath: "",
        maxY: 0,
      };
    }

    const max = Math.max(1, ...data.map((d) => Number(d.y ?? 0)));
    const min = 0;

    const padX = 18;
    const padTop = 16;
    const padBottom = 34;

    const innerW = W - padX * 2;
    const innerH = H - padTop - padBottom;

    const points = data.map((d, i) => {
      const x = padX + innerW * (data.length === 1 ? 0 : i / (data.length - 1));

      const yVal = Number(d.y ?? 0);
      const yNorm = max - min === 0 ? 0 : (yVal - min) / (max - min);
      const y = padTop + innerH * (1 - clamp(yNorm, 0, 1));
      return { x, y };
    });

    const line = makeSmoothPath(points);

    const last = points[points.length - 1];
    const first = points[0];
    const baseY = padTop + innerH;
    const area = `${line} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;

    return { pts: points, path: line, areaPath: area, maxY: max };
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
                : "Toca un punto para ver detalle"}
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
                <Defs>
                  <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="rgba(37,99,235,0.45)" />
                    <Stop offset="1" stopColor="rgba(37,99,235,0.04)" />
                  </LinearGradient>
                </Defs>

                <Path d={areaPath} fill={`url(#${gradId})`} />

                <Path
                  d={path}
                  fill="none"
                  stroke={
                    isLight ? "rgba(37,99,235,0.95)" : "rgba(147,197,253,0.95)"
                  }
                  strokeWidth={2.5}
                />

                {pts.map((p, i) => (
                  <Circle
                    key={`pt-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={picked === i ? 6 : 4}
                    fill={
                      picked === i
                        ? "rgba(37,99,235,1)"
                        : "rgba(37,99,235,0.75)"
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
