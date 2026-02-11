import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { useInventoryStore } from "@/src/store/inventoryStore";
import { useSalesStore } from "@/src/store/salesStore";

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

  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const productsAll = useInventoryStore((s) => s.products ?? []);
  const salesByBusiness = useSalesStore((s) => s.salesByBusiness ?? {});

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

  const todaySalesTotal = useMemo(() => {
    const now = new Date();
    return sales
      .filter((s: any) => {
        const d = safeDate(s.createdAt);
        return d ? sameDay(d, now) : false;
      })
      .reduce((acc: number, s: any) => acc + Number(s.total ?? 0), 0);
  }, [sales]);

  const last7DaysTotal = useMemo(() => {
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
        Resumen, análisis y exportación (demo sin backend).
      </Text>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <StatCard
          title="Ventas hoy"
          value={`$${todaySalesTotal.toFixed(2)}`}
          subtitle="Total del día"
          icon="today-outline"
          onPress={() => router.push("/(tabs)/reports/sales" as any)}
        />
        <StatCard
          title="Últimos 7 días"
          value={`$${last7DaysTotal.toFixed(2)}`}
          subtitle="Total semanal"
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
          Predicción simple usando promedio de ventas de los últimos 7 días.
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
          productos en bajo stock, revisa reposición antes del fin de semana.
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
          <AppButton
            title="SINCRONIZACIÓN"
            onPress={() => router.push("/(tabs)/reports/sync" as any)}
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
