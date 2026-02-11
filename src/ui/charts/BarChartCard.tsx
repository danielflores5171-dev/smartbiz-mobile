import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";

import { useTheme } from "@/context/theme-context";
import {
  type DashboardWidgetKey,
  persistDashboardWidgets,
  useDashboardWidgetsStore,
} from "@/src/store/dashboardWidgetsStore";

export type BarDatum = {
  x: string;
  y: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function BarChartCard({
  title,
  subtitle,
  icon,
  data,
  valueFmt,
  widgetKey,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  data: BarDatum[];
  valueFmt: (n: number) => string;
  widgetKey: DashboardWidgetKey;
}) {
  const { colors, mode } = useTheme();

  const enabled = useDashboardWidgetsStore((s) => s.enabled[widgetKey]);
  const toggle = useDashboardWidgetsStore((s) => s.toggle);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const sliced = useMemo(() => data.slice(0, 8), [data]);
  const maxY = useMemo(() => Math.max(1, ...sliced.map((d) => d.y)), [sliced]);

  // Dimensiones del chart (ajustables)
  const W = 320;
  const H = 200;
  const P = 16;
  const chartW = W - P * 2;
  const chartH = H - P * 2;

  const barGap = 10;
  const barCount = Math.max(1, sliced.length);
  const barW = (chartW - barGap * (barCount - 1)) / barCount;

  const selected = selectedIndex != null ? sliced[selectedIndex] : null;

  // superficies internas (chart / tooltip) coherentes en claro/oscuro
  const innerSurface =
    mode === "light" ? "rgba(15,23,42,0.03)" : "rgba(255,255,255,0.03)";
  const innerSurface2 =
    mode === "light" ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.05)";

  const toggleBg = enabled ? "rgba(34,197,94,0.18)" : colors.pillBg;

  const barFill = "rgba(37,99,235,0.70)";
  const barFillSel = "rgba(37,99,235,0.95)";

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
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              mode === "light"
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

        {/* Toggle Dashboard */}
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
            backgroundColor: toggleBg,
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

      {sliced.length === 0 ? (
        <Text style={{ color: colors.muted }}>(Sin datos para graficar)</Text>
      ) : (
        <>
          {/* Chart */}
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: innerSurface,
            }}
          >
            <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
              <G>
                {sliced.map((d, i) => {
                  const h = clamp((d.y / maxY) * chartH, 2, chartH);
                  const x = P + i * (barW + barGap);
                  const y = P + (chartH - h);
                  const isSel = i === selectedIndex;

                  return (
                    <G key={`${d.x}-${i}`}>
                      <Rect
                        x={x}
                        y={y}
                        width={barW}
                        height={h}
                        rx={8}
                        ry={8}
                        fill={isSel ? barFillSel : barFill}
                        onPress={() => setSelectedIndex(i)}
                      />

                      {/* Label eje X */}
                      <SvgText
                        x={x + barW / 2}
                        y={H - 6}
                        fontSize={10}
                        fill={colors.muted}
                        textAnchor="middle"
                      >
                        {d.x}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>
          </View>

          {/* “Tooltip” abajo */}
          <View style={{ marginTop: 12 }}>
            {selected ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: innerSurface2,
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "900" }}>
                  {selected.x}
                </Text>

                <Text style={{ color: colors.muted, marginTop: 4 }}>
                  Valor:{" "}
                  <Text
                    style={{
                      color: mode === "light" ? colors.accent : "#93c5fd",
                      fontWeight: "900",
                    }}
                  >
                    {valueFmt(selected.y)}
                  </Text>
                </Text>

                <Pressable
                  onPress={() => setSelectedIndex(null)}
                  style={{ marginTop: 10, alignSelf: "flex-start" }}
                >
                  <Text style={{ color: colors.accent, fontWeight: "900" }}>
                    Quitar selección
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={{ color: colors.muted }}>
                Tip: toca una barra para ver el detalle.
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}
