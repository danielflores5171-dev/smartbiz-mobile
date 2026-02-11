// app/(tabs)/dashboard.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { useDashboardWidgetsStore } from "@/src/store/dashboardWidgetsStore";
import {
  inventoryActions,
  useInventoryStore,
} from "@/src/store/inventoryStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { salesActions, useSalesStore } from "@/src/store/salesStore";

import BarChartCard, { type BarDatum } from "@/src/ui/charts/BarChartCard";
import LineAreaChartCard, {
  type LinePoint,
} from "@/src/ui/charts/LineAreaChartCard";
import MiniBarsChartCard, {
  type BarPoint,
} from "@/src/ui/charts/MiniBarsChartCard";

function StatCard({
  title,
  value,
  chip,
  icon,
  onPress,
}: {
  title: string;
  value: string;
  chip?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 14,
        minHeight: 98,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accentSoft, // ✅ antes: rgba(37,99,235,0.16)
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name={icon} size={18} color={colors.icon} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}
          >
            {title}
          </Text>

          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "900",
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {value}
          </Text>

          {chip ? (
            <View
              style={{
                marginTop: 8,
                alignSelf: "flex-start",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: colors.pillBg,
                borderWidth: 1,
                borderColor: colors.border,
                maxWidth: "100%",
              }}
            >
              <Text
                style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}
                numberOfLines={1}
              >
                {chip}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function startOfDayMs(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}
function fmtShortDay(dayStartMs: number) {
  const d = new Date(dayStartMs);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

type Row = {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
};

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );
  const hasBiz = !!activeBiz;

  const enabled = useDashboardWidgetsStore((s) => s.enabled);
  const widgetsHydrated = useDashboardWidgetsStore((s) => s.hydrated);
  const hydrateWidgets = useDashboardWidgetsStore((s) => s.hydrate);

  const allProducts = useInventoryStore((s) => s.products ?? []);
  const allAdjustments = useInventoryStore((s) => s.adjustments ?? []);
  const salesByBusiness = useSalesStore((s) => s.salesByBusiness ?? {});

  const notifications = useNotificationStore((s) => s.items ?? []);
  const unread = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const products = useMemo(() => {
    if (!activeBiz) return [];
    return allProducts.filter((p) => p.businessId === activeBiz.id);
  }, [allProducts, activeBiz?.id]);

  const lowStock = useMemo(() => {
    return products.filter((p) => p.minStock != null && p.stock <= p.minStock);
  }, [products]);

  const recentAdjustments = useMemo(() => {
    if (!activeBiz) return [];
    return allAdjustments
      .filter((a) => a.businessId === activeBiz.id)
      .slice(0, 5);
  }, [allAdjustments, activeBiz?.id]);

  const allSales = useMemo(() => {
    if (!activeBiz?.id) return [];
    return (salesByBusiness[String(activeBiz.id)] ?? []) as any[];
  }, [salesByBusiness, activeBiz?.id]);

  useEffect(() => {
    // OJO: idealmente el bootstrap ya lo hace app/(tabs)/_layout.tsx.
    // Aquí sólo mantenemos lo necesario para esta pantalla.
    void hydrateWidgets();

    if (activeBiz?.id) {
      void salesActions.loadSales(activeBiz.id);
      void inventoryActions.loadProducts(activeBiz.id);
    }
  }, [activeBiz?.id, hydrateWidgets]);

  const sales30 = useMemo(() => {
    if (!activeBiz) return [];
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

    return allSales.filter((sale: any) => {
      if (sale?.businessId !== activeBiz.id) return false;
      const t = new Date(sale.createdAt).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });
  }, [allSales, activeBiz?.id]);

  const topRows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();

    for (const sale of sales30) {
      const items = (sale?.items ?? []) as any[];
      for (const it of items) {
        const id = String(it?.productId ?? "");
        if (!id) continue;

        const name = String(it?.name ?? "Producto");
        const qty = Number(it?.qty ?? 0) || 0;
        const price = Number(it?.price ?? 0) || 0;
        const revenue = round2(qty * price);

        const prev = map.get(id);
        if (!prev) map.set(id, { productId: id, name, qty, revenue });
        else {
          prev.qty += qty;
          prev.revenue = round2(prev.revenue + revenue);
        }
      }
    }

    return Array.from(map.values());
  }, [sales30]);

  const tpRevenue = useMemo<BarDatum[]>(() => {
    return topRows
      .slice()
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((r) => ({
        x: r.name.length > 10 ? r.name.slice(0, 10) + "…" : r.name,
        y: r.revenue,
      }));
  }, [topRows]);

  const tpQty = useMemo<BarDatum[]>(() => {
    return topRows
      .slice()
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((r) => ({
        x: r.name.length > 10 ? r.name.slice(0, 10) + "…" : r.name,
        y: r.qty,
      }));
  }, [topRows]);

  const spSeries = useMemo(() => {
    if (!activeBiz) {
      return { totalLine: [] as LinePoint[], countBars: [] as BarPoint[] };
    }

    const end = startOfDayMs(new Date());
    const start = end - 13 * 24 * 60 * 60 * 1000;

    const map = new Map<number, { total: number; count: number }>();

    for (const s of allSales) {
      if (s?.businessId !== activeBiz.id) continue;
      const day = startOfDayMs(new Date(s.createdAt));
      if (!Number.isFinite(day)) continue;
      if (day < start || day > end) continue;

      const prev = map.get(day) ?? { total: 0, count: 0 };
      prev.total = round2(prev.total + (Number(s?.total ?? 0) || 0));
      prev.count += 1;
      map.set(day, prev);
    }

    const totalLine: LinePoint[] = [];
    const countBars: BarPoint[] = [];

    for (let d = start; d <= end; d += 24 * 60 * 60 * 1000) {
      const v = map.get(d);
      totalLine.push({ x: fmtShortDay(d), y: v?.total ?? 0 });
      countBars.push({ x: fmtShortDay(d), y: v?.count ?? 0 });
    }

    return { totalLine, countBars };
  }, [allSales, activeBiz?.id]);

  return (
    <Screen scroll padded>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900" }}>
        Dashboard
      </Text>
      <Text style={{ color: colors.muted, marginTop: 6 }}>
        Resumen rápido de tu negocio y alertas importantes.
      </Text>

      {!hasBiz ? (
        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
            Aún no has seleccionado un negocio
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Ve a “Negocio” para crear o seleccionar uno y empezar a usar el
            sistema.
          </Text>
          <View style={{ marginTop: 14 }}>
            <AppButton
              title="IR A NEGOCIO"
              onPress={() => router.push("/business" as any)} // ✅ antes: /(tabs)/business
              variant="primary"
            />
          </View>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <StatCard
              title="Productos"
              value={String(products.length)}
              chip="En inventario"
              icon="cube-outline"
              onPress={() => router.push("/inventory" as any)} // ✅
            />
            <StatCard
              title="Alertas"
              value={String(lowStock.length)}
              chip="Bajo stock"
              icon="warning-outline"
              onPress={() => router.push("/inventory" as any)} // ✅
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <StatCard
              title="Notificaciones"
              value={String(unread)}
              chip="Sin leer"
              icon="notifications-outline"
              onPress={() => router.push("/notifications" as any)} // ✅
            />
            <StatCard
              title="Negocio activo"
              value={activeBiz?.name ?? "—"}
              chip="Seleccionar"
              icon="business-outline"
              onPress={() => router.push("/business" as any)} // ✅
            />
          </View>

          <View
            style={{
              marginTop: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}
            >
              Widgets (gráficas)
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Muestra sólo lo que tengas agregado desde Reportes.
            </Text>

            <View
              style={{
                height: 1,
                backgroundColor: colors.divider,
                marginVertical: 16,
              }}
            />

            {!widgetsHydrated ? (
              <Text style={{ color: colors.muted }}>(Cargando widgets…)</Text>
            ) : (
              <>
                {enabled.tp_revenue ? (
                  <BarChartCard
                    title="Top ingresos (30 días)"
                    subtitle="Top 5 por ingresos."
                    icon="bar-chart-outline"
                    data={tpRevenue}
                    valueFmt={(n: number) => `$${n.toFixed(2)}`}
                    widgetKey="tp_revenue"
                  />
                ) : null}

                {enabled.tp_qty ? (
                  <BarChartCard
                    title="Top unidades (30 días)"
                    subtitle="Top 5 por unidades."
                    icon="stats-chart-outline"
                    data={tpQty}
                    valueFmt={(n: number) => `${n}`}
                    widgetKey="tp_qty"
                  />
                ) : null}

                {enabled.sp_total_by_day ? (
                  <LineAreaChartCard
                    title="Tendencia: Total vendido por día"
                    subtitle="Área + línea (últimos 14 días)."
                    icon="pulse-outline"
                    data={spSeries.totalLine}
                    valueFmt={(n: number) => `$${n.toFixed(2)}`}
                    widgetKey="sp_total_by_day"
                    height={200}
                  />
                ) : null}

                {enabled.sp_count_by_day ? (
                  <MiniBarsChartCard
                    title="Volumen: Ventas por día (conteo)"
                    subtitle="Barras compactas (últimos 14 días)."
                    icon="podium-outline"
                    data={spSeries.countBars}
                    valueFmt={(n: number) => `${n}`}
                    widgetKey="sp_count_by_day"
                    height={180}
                  />
                ) : null}

                {!enabled.tp_revenue &&
                !enabled.tp_qty &&
                !enabled.sp_total_by_day &&
                !enabled.sp_count_by_day ? (
                  <Text style={{ color: colors.muted }}>
                    (No tienes widgets agregados. Ve a Reportes y toca
                    “AGREGAR”.)
                  </Text>
                ) : null}
              </>
            )}
          </View>

          <View
            style={{
              marginTop: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              padding: 16,
            }}
          >
            <Text
              style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}
            >
              Acciones rápidas
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Atajos para lo más común.
            </Text>

            <View style={{ marginTop: 14, gap: 10 }}>
              <AppButton
                title="AGREGAR PRODUCTO"
                onPress={() => router.push("/inventory/create" as any)} // ✅
                variant="primary"
              />
              <AppButton
                title="VER INVENTARIO"
                onPress={() => router.push("/inventory" as any)} // ✅
                variant="secondary"
              />
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: colors.divider,
                marginVertical: 16,
              }}
            />

            <Text style={{ color: colors.text, fontWeight: "900" }}>
              Movimientos recientes
            </Text>

            <View style={{ marginTop: 10, gap: 10 }}>
              {recentAdjustments.length === 0 ? (
                <Text style={{ color: colors.muted }}>
                  (Aún no hay movimientos)
                </Text>
              ) : (
                recentAdjustments.map((a) => (
                  <View
                    key={a.id}
                    style={{
                      backgroundColor: colors.pillBg,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 16,
                      padding: 12,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "900" }}>
                      {a.reason}{" "}
                      <Text style={{ color: colors.muted, fontWeight: "700" }}>
                        ({a.delta > 0 ? `+${a.delta}` : `${a.delta}`})
                      </Text>
                    </Text>
                    <Text
                      style={{
                        color: colors.muted,
                        marginTop: 4,
                        fontSize: 12,
                      }}
                    >
                      {new Date(a.createdAt).toLocaleString()}
                      {a.note ? ` · ${a.note}` : ""}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}
