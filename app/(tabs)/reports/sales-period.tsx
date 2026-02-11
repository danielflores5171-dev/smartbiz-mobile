import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { useSalesStore } from "@/src/store/salesStore";
import type { Sale } from "@/src/types/sales";

import LineAreaChartCard, {
  type LinePoint,
} from "@/src/ui/charts/LineAreaChartCard";
import MiniBarsChartCard, {
  type BarPoint,
} from "@/src/ui/charts/MiniBarsChartCard";

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(input: string) {
  const parts = input.split("-");
  if (parts.length !== 3) return null;

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return null;
  if (y < 1970 || m < 1 || m > 12 || d < 1 || d > 31) return null;

  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;

  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d)
    return null;
  return dt;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function safeTime(value: unknown): number {
  const t = new Date(String(value ?? "")).getTime();
  return Number.isFinite(t) ? t : 0;
}

function startOfDayMs(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function addDaysMs(dayStartMs: number, days: number) {
  return dayStartMs + days * 24 * 60 * 60 * 1000;
}

function fmtShortDay(dayStartMs: number) {
  const d = new Date(dayStartMs);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

export default function SalesPeriodReport() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const allSales = useSalesStore((s) => {
    if (!activeBusinessId) return [] as Sale[];
    return (s.salesByBusiness?.[String(activeBusinessId)] ?? []) as Sale[];
  });

  const defaultTo = new Date();
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const [fromStr, setFromStr] = useState(toISODate(defaultFrom));
  const [toStr, setToStr] = useState(toISODate(defaultTo));

  const range = useMemo(() => {
    const from = parseISODate(fromStr.trim());
    const to = parseISODate(toStr.trim());
    if (!from || !to)
      return { ok: false as const, msg: "Fechas inválidas. Usa YYYY-MM-DD." };

    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);

    if (from.getTime() > toEnd.getTime()) {
      return {
        ok: false as const,
        msg: "La fecha 'Desde' no puede ser mayor que 'Hasta'.",
      };
    }
    return { ok: true as const, from, toEnd };
  }, [fromStr, toStr]);

  const salesInRange = useMemo(() => {
    if (!range.ok) return allSales;

    const min = range.from.getTime();
    const max = range.toEnd.getTime();

    return allSales.filter((s: Sale) => {
      const t = safeTime(s.createdAt);
      return t >= min && t <= max;
    });
  }, [allSales, range]);

  const totals = useMemo(() => {
    const subtotal = round2(
      salesInRange.reduce((acc, s) => acc + Number(s.subtotal ?? 0), 0),
    );
    const discount = round2(
      salesInRange.reduce((acc, s) => acc + Number(s.discount ?? 0), 0),
    );
    const base = round2(
      salesInRange.reduce((acc, s) => acc + Number(s.taxableBase ?? 0), 0),
    );
    const tax = round2(
      salesInRange.reduce((acc, s) => acc + Number(s.taxAmount ?? 0), 0),
    );
    const total = round2(
      salesInRange.reduce((acc, s) => acc + Number(s.total ?? 0), 0),
    );
    return { subtotal, discount, base, tax, total };
  }, [salesInRange]);

  const lastSales = useMemo(() => {
    return salesInRange
      .slice()
      .sort((a, b) => safeTime(b.createdAt) - safeTime(a.createdAt))
      .slice(0, 8);
  }, [salesInRange]);

  const spSeries = useMemo(() => {
    if (!range.ok)
      return { totalLine: [] as LinePoint[], countBars: [] as BarPoint[] };

    const fromDay = startOfDayMs(range.from);
    const toDay = startOfDayMs(range.toEnd);

    const map = new Map<number, { total: number; count: number }>();

    for (const s of salesInRange) {
      const day = startOfDayMs(new Date(String(s.createdAt ?? "")));
      const prev = map.get(day) ?? { total: 0, count: 0 };
      prev.total = round2(prev.total + Number(s.total ?? 0));
      prev.count += 1;
      map.set(day, prev);
    }

    const pointsTotal: LinePoint[] = [];
    const pointsCount: BarPoint[] = [];

    for (let d = fromDay; d <= toDay; d = addDaysMs(d, 1)) {
      const v = map.get(d);
      pointsTotal.push({ x: fmtShortDay(d), y: v?.total ?? 0 });
      pointsCount.push({ x: fmtShortDay(d), y: v?.count ?? 0 });
    }

    const MAX_POINTS = 14;
    const totalLine =
      pointsTotal.length > MAX_POINTS
        ? pointsTotal.slice(-MAX_POINTS)
        : pointsTotal;
    const countBars =
      pointsCount.length > MAX_POINTS
        ? pointsCount.slice(-MAX_POINTS)
        : pointsCount;

    return { totalLine, countBars };
  }, [range, salesInRange]);

  if (!activeBiz || !activeBusinessId) {
    return (
      <Screen center padded>
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Primero selecciona un negocio.
        </Text>
        <View style={{ marginTop: 12 }}>
          <AppButton
            title="VOLVER A REPORTES"
            onPress={() => router.replace("/(tabs)/reports" as any)}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card2,
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}
            >
              Ventas por periodo
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              {activeBiz.name} · Filtra por fechas (demo).
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 12, gap: 10 }}>
          <AppInput
            label="Desde (YYYY-MM-DD)"
            value={fromStr}
            onChangeText={setFromStr}
            autoCapitalize="none"
            placeholder="2026-01-01"
            emphasis
          />
          <AppInput
            label="Hasta (YYYY-MM-DD)"
            value={toStr}
            onChangeText={setToStr}
            autoCapitalize="none"
            placeholder="2026-01-31"
            emphasis
          />
        </View>

        {!range.ok ? (
          <View
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: colors.dangerBorder,
              backgroundColor: colors.dangerBg,
              padding: 12,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: colors.dangerText, fontWeight: "900" }}>
              Revisa el rango
            </Text>
            <Text
              style={{ color: colors.dangerText, marginTop: 4, opacity: 0.9 }}
            >
              {range.msg}
            </Text>
          </View>
        ) : null}

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text style={{ color: colors.text, fontWeight: "900" }}>Resumen</Text>

        <View style={{ marginTop: 10, gap: 6 }}>
          <Text style={{ color: colors.muted }}>
            Ventas:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {salesInRange.length}
            </Text>
          </Text>
          <Text style={{ color: colors.muted }}>
            Subtotal:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${totals.subtotal.toFixed(2)}
            </Text>
          </Text>
          <Text style={{ color: colors.muted }}>
            Descuento:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${totals.discount.toFixed(2)}
            </Text>
          </Text>
          <Text style={{ color: colors.muted }}>
            Base:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${totals.base.toFixed(2)}
            </Text>
          </Text>
          <Text style={{ color: colors.muted }}>
            IVA:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${totals.tax.toFixed(2)}
            </Text>
          </Text>
          <Text style={{ color: colors.muted, marginTop: 2 }}>
            Total:{" "}
            <Text style={{ color: colors.accent, fontWeight: "900" }}>
              ${totals.total.toFixed(2)}
            </Text>
          </Text>
        </View>
      </View>

      <LineAreaChartCard
        title="Tendencia: Total vendido por día"
        subtitle="Área + línea (últimos 14 días del rango)."
        icon="pulse-outline"
        data={spSeries.totalLine}
        valueFmt={(n: number) => `$${n.toFixed(2)}`}
        widgetKey="sp_total_by_day"
      />

      <MiniBarsChartCard
        title="Volumen: Ventas por día (conteo)"
        subtitle="Barras compactas (últimos 14 días del rango)."
        icon="podium-outline"
        data={spSeries.countBars}
        valueFmt={(n: number) => `${n}`}
        widgetKey="sp_count_by_day"
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
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Últimas ventas del periodo
        </Text>

        <View style={{ marginTop: 10, gap: 10 }}>
          {lastSales.length === 0 ? (
            <Text style={{ color: colors.muted }}>
              (No hay ventas en el periodo)
            </Text>
          ) : (
            lastSales.map((s: Sale) => {
              const total = Number(s.total ?? 0);
              const base = Number(s.taxableBase ?? 0);
              const tax = Number(s.taxAmount ?? 0);
              const taxRate = typeof s.taxRate === "number" ? s.taxRate : null;

              return (
                <Pressable
                  key={String(s.id)}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/sales/sales-detail",
                      params: { id: s.id },
                    } as any)
                  }
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    padding: 12,
                    backgroundColor: colors.card2,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "900" }}>
                        Venta{" "}
                        <Text
                          style={{ color: colors.accent, fontWeight: "900" }}
                        >
                          ${total.toFixed(2)}
                        </Text>
                      </Text>

                      <Text
                        style={{
                          color: colors.muted,
                          marginTop: 4,
                          fontSize: 12,
                        }}
                      >
                        {new Date(String(s.createdAt ?? "")).toLocaleString()} ·{" "}
                        {String(s.paymentMethod ?? "—")}
                        {taxRate !== null
                          ? ` · IVA ${Math.round(taxRate * 100)}%`
                          : ""}
                      </Text>

                      <Text
                        style={{
                          color: colors.muted,
                          marginTop: 4,
                          fontSize: 12,
                        }}
                      >
                        Items:{" "}
                        <Text style={{ color: colors.text, fontWeight: "900" }}>
                          {s.items?.length ?? 0}
                        </Text>{" "}
                        · Base{" "}
                        <Text style={{ color: colors.text, fontWeight: "900" }}>
                          ${base.toFixed(2)}
                        </Text>{" "}
                        · IVA{" "}
                        <Text style={{ color: colors.text, fontWeight: "900" }}>
                          ${tax.toFixed(2)}
                        </Text>
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.muted}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="VER HISTORIAL COMPLETO"
            onPress={() => router.push("/(tabs)/sales/sales-history" as any)}
            variant="secondary"
          />
          <AppButton
            title="TOP PRODUCTOS"
            onPress={() => router.push("/(tabs)/reports/top-products" as any)}
            variant="secondary"
          />
          <AppButton
            title="EXPORTAR REPORTES"
            onPress={() => router.push("/(tabs)/reports/export" as any)}
            variant="primary"
          />
          <AppButton
            title="VOLVER A REPORTES"
            onPress={() => router.replace("/(tabs)/reports" as any)}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
}
