import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { salesActions, useSalesStore } from "@/src/store/salesStore";

import BarChartCard, { type BarDatum } from "@/src/ui/charts/BarChartCard";

import type { ID } from "@/src/types/business";
import type { CartItem, Sale } from "@/src/types/sales";

type Row = {
  productId: string;
  name: string;
  unit?: string;
  qty: number;
  revenue: number;
  lastAt: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function shortLabel(s: string, max = 10) {
  const t = String(s ?? "");
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function safeTime(value: unknown): number {
  const t = new Date(String(value ?? "")).getTime();
  return Number.isFinite(t) ? t : 0;
}

function getItemProductId(it: CartItem): string {
  const maybe =
    (it as unknown as { productId?: unknown }).productId ??
    (it as unknown as { id?: unknown }).id ??
    (it as unknown as { sku?: unknown }).sku ??
    it.name ??
    "unknown";
  return String(maybe);
}

function getItemQty(it: CartItem): number {
  const n = Number((it as unknown as { qty?: unknown }).qty ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getItemPrice(it: CartItem): number {
  const n = Number((it as unknown as { price?: unknown }).price ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getItemUnit(it: CartItem): string | undefined {
  const u = (it as unknown as { unit?: unknown }).unit;
  return u ? String(u) : undefined;
}

export default function TopProductsReport() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);

  const allSales = useSalesStore((s) => {
    if (!activeBusinessId) return [] as Sale[];
    return (s.salesByBusiness?.[String(activeBusinessId)] ?? []) as Sale[];
  });

  const [days, setDays] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    void salesActions.bootstrap();
    if (activeBusinessId) void salesActions.loadSales(activeBusinessId as ID);
  }, [activeBusinessId]);

  const sales = useMemo<Sale[]>(() => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return allSales.filter((sale: Sale) => safeTime(sale.createdAt) >= cutoff);
  }, [allSales, days]);

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();

    for (const sale of sales) {
      const t = safeTime(sale.createdAt);
      const items = (sale.items ?? []) as CartItem[];

      for (const it of items) {
        const productId = getItemProductId(it);
        const prev = map.get(productId);

        const qty = getItemQty(it);
        const price = getItemPrice(it);
        const revenue = round2(qty * price);
        const unit = getItemUnit(it);

        if (!prev) {
          map.set(productId, {
            productId,
            name: String(it.name ?? "Producto"),
            unit,
            qty,
            revenue,
            lastAt: t,
          });
        } else {
          prev.qty += qty;
          prev.revenue = round2(prev.revenue + revenue);
          if (t > prev.lastAt) prev.lastAt = t;
        }
      }
    }

    return Array.from(map.values());
  }, [sales]);

  const topByRevenue = useMemo(
    () =>
      rows
        .slice()
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    [rows],
  );
  const topByQty = useMemo(
    () =>
      rows
        .slice()
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10),
    [rows],
  );

  const chartRev = useMemo<BarDatum[]>(
    () =>
      topByRevenue
        .slice(0, 5)
        .map((r) => ({ x: shortLabel(r.name), y: round2(r.revenue) })),
    [topByRevenue],
  );

  const chartQty = useMemo<BarDatum[]>(
    () =>
      topByQty.slice(0, 5).map((r) => ({ x: shortLabel(r.name), y: r.qty })),
    [topByQty],
  );

  const totalRevenue = useMemo(
    () => round2(rows.reduce((acc, r) => acc + r.revenue, 0)),
    [rows],
  );
  const totalUnits = useMemo(
    () => rows.reduce((acc, r) => acc + r.qty, 0),
    [rows],
  );

  const insight = useMemo(() => {
    if (rows.length === 0) {
      return {
        title: "Aún no hay datos",
        body: "Cuando registres ventas, aquí aparecerán gráficas y recomendaciones automáticas.",
      };
    }

    const best = topByRevenue[0];
    const dominance =
      totalRevenue > 0 ? clamp((best?.revenue ?? 0) / totalRevenue, 0, 1) : 0;

    const a = best
      ? `• Tu producto #1 por ingresos es "${best.name}" ($${best.revenue.toFixed(2)}).`
      : `• No hay top por ingresos aún.`;

    const b =
      dominance >= 0.55
        ? `• Alta concentración: el #1 aporta ${Math.round(dominance * 100)}% del ingreso del periodo. Considera impulsar el #2/#3 para balancear.`
        : `• Buen balance: el #1 aporta ${Math.round(dominance * 100)}% del ingreso del periodo.`;

    const bestQty = topByQty[0];
    const c = bestQty
      ? `• Más vendido por unidades: "${bestQty.name}" (${bestQty.qty} u.).`
      : "";

    return {
      title: "Asistente (IA demo)",
      body: [a, b, c].filter(Boolean).join("\n"),
    };
  }, [rows.length, topByRevenue, topByQty, totalRevenue]);

  const Pill = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: active ? colors.pillBgActive : colors.pillBg,
      }}
    >
      <Ionicons
        name="calendar-outline"
        size={16}
        color={active ? "#93c5fd" : colors.muted}
      />
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}>
        {label}
      </Text>
    </Pressable>
  );

  const RowCard = ({
    r,
    rightValue,
    rightLabel,
  }: {
    r: Row;
    rightValue: string;
    rightLabel: string;
  }) => (
    <View
      style={{
        backgroundColor: colors.card2,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {r.name}{" "}
            {r.unit ? (
              <Text style={{ color: colors.accent, fontWeight: "900" }}>
                · {String(r.unit).toUpperCase()}
              </Text>
            ) : null}
          </Text>

          <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
            Cantidad:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {r.qty}
            </Text>
            {" · "}Última:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {new Date(r.lastAt).toLocaleDateString()}
            </Text>
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#93c5fd", fontWeight: "900" }}>
            {rightValue}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {rightLabel}
          </Text>
        </View>
      </View>
    </View>
  );

  if (!activeBusinessId) {
    return (
      <Screen center padded>
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Primero selecciona un negocio.
        </Text>
        <View style={{ marginTop: 12 }}>
          <AppButton
            title="IR A NEGOCIO"
            onPress={() => router.replace("/(tabs)/business" as any)}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900" }}>
        Top productos
      </Text>
      <Text style={{ color: colors.muted, marginTop: 6 }}>
        Ranking por ventas (demo) del negocio activo.
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 14,
        }}
      >
        <Pill
          label="Últimos 7 días"
          active={days === 7}
          onPress={() => setDays(7)}
        />
        <Pill
          label="Últimos 30 días"
          active={days === 30}
          onPress={() => setDays(30)}
        />
        <Pill
          label="Últimos 90 días"
          active={days === 90}
          onPress={() => setDays(90)}
        />
      </View>

      <View style={{ marginTop: 14, gap: 10 }}>
        <AppButton
          title="VER HISTORIAL DE VENTAS"
          onPress={() => router.push("/(tabs)/sales/sales-history" as any)}
          variant="secondary"
        />
      </View>

      <View
        style={{
          marginTop: 14,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
          {insight.title}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 18 }}>
          {insight.body}
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <Text style={{ color: colors.muted }}>
          Ingresos del periodo:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${totalRevenue.toFixed(2)}
          </Text>
          {"  ·  "}Unidades:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {totalUnits}
          </Text>
        </Text>
      </View>

      <BarChartCard
        title="Top ingresos (gráfica)"
        subtitle="Top 5 por ingresos (toca barras para ver detalle)."
        icon="bar-chart-outline"
        data={chartRev}
        valueFmt={(n: number) => `$${n.toFixed(2)}`}
        widgetKey="tp_revenue"
      />

      <BarChartCard
        title="Top unidades (gráfica)"
        subtitle="Top 5 por unidades (toca barras para ver detalle)."
        icon="stats-chart-outline"
        data={chartQty}
        valueFmt={(n: number) => `${n}`}
        widgetKey="tp_qty"
      />

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
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons
              name="trending-up-outline"
              size={18}
              color={colors.accent}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}
            >
              Top por ingresos
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Suma de (precio × cantidad).
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <View style={{ gap: 10 }}>
          {topByRevenue.length === 0 ? (
            <Text style={{ color: colors.muted }}>
              (Aún no hay ventas en este periodo)
            </Text>
          ) : (
            topByRevenue.map((r) => (
              <RowCard
                key={`rev-${r.productId}`}
                r={r}
                rightValue={`$${r.revenue.toFixed(2)}`}
                rightLabel="Ingresos"
              />
            ))
          )}
        </View>
      </View>

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
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="layers-outline" size={18} color={colors.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}
            >
              Top por cantidad
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Suma de cantidades vendidas.
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <View style={{ gap: 10 }}>
          {topByQty.length === 0 ? (
            <Text style={{ color: colors.muted }}>
              (Aún no hay ventas en este periodo)
            </Text>
          ) : (
            topByQty.map((r) => (
              <RowCard
                key={`qty-${r.productId}`}
                r={r}
                rightValue={`${r.qty}`}
                rightLabel="Unidades"
              />
            ))
          )}
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <AppButton
          title="VOLVER A REPORTES"
          onPress={() => router.replace("/(tabs)/reports" as any)}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}
