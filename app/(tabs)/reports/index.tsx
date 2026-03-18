// app/(tabs)/reports/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { useInventoryStore } from "@/src/store/inventoryStore";
import { reportsActions, useReportsStore } from "@/src/store/reportsStore";
import { useSalesStore } from "@/src/store/salesStore";
import AppButton from "@/src/ui/AppButton";
import ModuleStatusCard from "@/src/ui/ModuleStatusCard";
import Screen from "@/src/ui/Screen";

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function safeDate(input: unknown): Date | null {
  const d = input instanceof Date ? input : new Date(String(input ?? ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  value: string;
  subtitle?: string;
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
        minHeight: 92,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}
          >
            {title}
          </Text>

          <Text
            style={{
              color: colors.text,
              fontSize: 20,
              fontWeight: "900",
              marginTop: 2,
            }}
          >
            {value}
          </Text>

          {subtitle ? (
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function ReportsIndex() {
  const router = useRouter();
  const { colors } = useTheme();

  const token = useAuthStore((s) => s.token);
  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const productsAll = useInventoryStore((s) => s.products ?? []);
  const salesByBusiness = useSalesStore((s) => s.salesByBusiness ?? {});

  const summary = useReportsStore((s) => s.statisticsSummary);
  const error = useReportsStore((s) => s.error);

  useEffect(() => {
    if (!activeBusinessId) return;

    void reportsActions.fetchStatisticsSummary(
      activeBusinessId,
      token,
      "month",
    );
  }, [activeBusinessId, token]);

  const products = useMemo(() => {
    if (!activeBiz) return [];
    return productsAll.filter((p: any) => p.businessId === activeBiz.id);
  }, [productsAll, activeBiz?.id]);

  const sales = useMemo(() => {
    if (!activeBiz) return [];
    return salesByBusiness[String(activeBiz.id)] ?? [];
  }, [salesByBusiness, activeBiz?.id]);

  const lowStockCount = useMemo(() => {
    return products.filter(
      (p: any) => p.minStock != null && p.stock <= p.minStock,
    ).length;
  }, [products]);

  const todaySalesTotalLocal = useMemo(() => {
    const now = new Date();
    return sales
      .filter((s: any) => {
        const d = safeDate(s.createdAt);
        return d ? sameDay(d, now) : false;
      })
      .reduce((acc: number, s: any) => acc + Number(s.total ?? 0), 0);
  }, [sales]);

  const last7DaysTotalLocal = useMemo(() => {
    const min = new Date(daysAgoISO(7)).getTime();
    return sales
      .filter((s: any) => {
        const d = safeDate(s.createdAt);
        return d ? d.getTime() >= min : false;
      })
      .reduce((acc: number, s: any) => acc + Number(s.total ?? 0), 0);
  }, [sales]);

  const forecast7 = useMemo(() => {
    const min = new Date(daysAgoISO(7)).getTime();
    const last7 = sales.filter(
      (s: any) => (safeDate(s.createdAt)?.getTime() ?? 0) >= min,
    );
    if (last7.length === 0) return 0;

    const avgPerDay =
      last7.reduce((a: number, s: any) => a + Number(s.total ?? 0), 0) / 7;

    return Math.max(0, avgPerDay * 7);
  }, [sales]);

  const todaySalesTotal =
    Number(summary?.kpis?.total_sales ?? 0) > 0 &&
    summary?.range?.preset === "today"
      ? Number(summary.kpis.total_sales)
      : todaySalesTotalLocal;

  const monthTotalFromApi =
    Number(summary?.kpis?.total_sales ?? 0) > 0
      ? Number(summary.kpis.total_sales)
      : last7DaysTotalLocal;

  if (!activeBiz) {
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
        Reportes
      </Text>
      <Text style={{ color: colors.muted, marginTop: 6 }}>
        Resumen, análisis y exportación. Si backend no autoriza, usa fallback
        local/demo.
      </Text>

      <ModuleStatusCard
        connectedText="Resumen estadístico, reportes de ventas, inventario y exportación CSV ya coinciden con la web; falta autorización Bearer/cookies para consumir backend real."
        demoText="Predicción simple local, métricas de respaldo, exportaciones demo/TXT y parte del comportamiento de reportes mientras backend no autoriza."
      />

      {error ? (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Text style={{ color: colors.muted }}>{error}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <StatCard
          title="Ventas hoy"
          value={`$${todaySalesTotal.toFixed(2)}`}
          subtitle="Total del día"
          icon="today-outline"
          onPress={() => router.push("/(tabs)/reports/sales" as any)}
        />
        <StatCard
          title="Periodo"
          value={`$${monthTotalFromApi.toFixed(2)}`}
          subtitle="Resumen desde API o local"
          icon="stats-chart-outline"
          onPress={() => router.push("/(tabs)/reports/sales-period" as any)}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <StatCard
          title="Productos"
          value={String(products.length)}
          subtitle="En inventario"
          icon="cube-outline"
          onPress={() => router.push("/(tabs)/reports/inventory" as any)}
        />
        <StatCard
          title="Alertas"
          value={String(lowStockCount)}
          subtitle="Bajo stock"
          icon="warning-outline"
          onPress={() => router.push("/(tabs)/reports/inventory" as any)}
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
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
          Asistente (IA demo)
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Predicción simple usando promedio local de ventas de los últimos 7
          días.
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <Text style={{ color: colors.muted }}>
          Proyección próximos 7 días:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${forecast7.toFixed(2)}
          </Text>
        </Text>

        <Text style={{ color: colors.muted, marginTop: 10 }}>
          Recomendación:
          {"\n"}• Si tienes{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {lowStockCount}
          </Text>{" "}
          productos en bajo stock, revisa reposición.
          {"\n"}• Usa “Top productos” para identificar los más vendidos.
        </Text>

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton
            title="VER TOP PRODUCTOS"
            onPress={() => router.push("/(tabs)/reports/top-products" as any)}
            variant="primary"
          />
          <AppButton
            title="EXPORTAR REPORTES"
            onPress={() => router.push("/(tabs)/reports/export" as any)}
            variant="secondary"
          />
        </View>
      </View>

      <View style={{ marginTop: 16, gap: 10 }}>
        <AppButton
          title="VENTAS"
          onPress={() => router.push("/(tabs)/reports/sales" as any)}
          variant="secondary"
        />
        <AppButton
          title="VENTAS POR PERIODO"
          onPress={() => router.push("/(tabs)/reports/sales-period" as any)}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}
