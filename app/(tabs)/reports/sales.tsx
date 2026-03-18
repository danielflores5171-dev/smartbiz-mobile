// app/(tabs)/reports/sales.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { reportsActions, useReportsStore } from "@/src/store/reportsStore";
import { useSalesStore } from "@/src/store/salesStore";
import type { PaymentMethod } from "@/src/types/sales";
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

const methodLabel = (m: PaymentMethod) => {
  if (m === "cash") return "Efectivo";
  if (m === "card") return "Tarjeta";
  if (m === "transfer") return "Transferencia";
  return "Otro";
};

export default function ReportsSales() {
  const router = useRouter();
  const { colors } = useTheme();

  const token = useAuthStore((s) => s.token);
  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const report = useReportsStore((s) => s.salesReport);
  const error = useReportsStore((s) => s.error);

  const salesByBusiness = useSalesStore((s) => s.salesByBusiness ?? {});
  const salesLocal = useMemo(() => {
    if (!activeBiz) return [];
    return (salesByBusiness[String(activeBiz.id)] ?? [])
      .slice()
      .sort((a: any, b: any) => {
        const ta = safeDate(a.createdAt)?.getTime() ?? 0;
        const tb = safeDate(b.createdAt)?.getTime() ?? 0;
        return tb - ta;
      });
  }, [salesByBusiness, activeBiz?.id]);

  useEffect(() => {
    if (!activeBusinessId) return;
    void reportsActions.fetchSalesReport(activeBusinessId, token, {
      range: "month",
    });
  }, [activeBusinessId, token]);

  const last30Local = useMemo(() => {
    const min = new Date(daysAgoISO(30)).getTime();
    return salesLocal.filter(
      (s: any) => (safeDate(s.createdAt)?.getTime() ?? 0) >= min,
    );
  }, [salesLocal]);

  const total30Local = useMemo(
    () =>
      last30Local.reduce(
        (acc: number, s: any) => acc + Number(s.total ?? 0),
        0,
      ),
    [last30Local],
  );

  const byMethodLocal = useMemo(() => {
    const base: Record<PaymentMethod, number> = {
      cash: 0,
      card: 0,
      transfer: 0,
      other: 0,
    };

    for (const s of last30Local) {
      const key =
        s.paymentMethod === "cash" ||
        s.paymentMethod === "card" ||
        s.paymentMethod === "transfer" ||
        s.paymentMethod === "other"
          ? s.paymentMethod
          : "other";
      base[key] += Number(s.total ?? 0);
    }

    return base;
  }, [last30Local]);

  const byMethodApi = useMemo(() => {
    const base: Record<PaymentMethod, number> = {
      cash: 0,
      card: 0,
      transfer: 0,
      other: 0,
    };

    const daily = Array.isArray(report?.series_daily)
      ? report.series_daily
      : [];
    const total = Number(report?.kpis?.total_sales ?? 0);

    if (!daily.length || total <= 0) return null;
    return base;
  }, [report]);

  const byMethod = byMethodApi ?? byMethodLocal;

  const maxMethod = useMemo(
    () => Math.max(1, ...Object.values(byMethod)),
    [byMethod],
  );

  const total30 =
    Number(report?.kpis?.total_sales ?? 0) > 0
      ? Number(report.kpis.total_sales)
      : total30Local;

  const count30 =
    Number(report?.kpis?.orders ?? 0) > 0
      ? Number(report.kpis.orders)
      : last30Local.length;

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
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
          Reporte de ventas
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Últimos 30 días. Si backend falla, usa datos locales.
        </Text>

        <ModuleStatusCard
          connectedText="Resumen de ventas, KPIs y estructura del reporte mensual ya coinciden con web; falta autorización Bearer/cookies para consumir métricas reales."
          demoText="Distribución local por método de pago y respaldo con ventas locales mientras backend no autoriza."
        />

        {error ? (
          <Text style={{ color: colors.muted, marginTop: 10 }}>{error}</Text>
        ) : null}

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.muted }}>
            Total 30 días:{" "}
            <Text style={{ color: colors.accent, fontWeight: "900" }}>
              ${total30.toFixed(2)}
            </Text>
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Ventas registradas:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {count30}
            </Text>
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Por método de pago
        </Text>

        <View style={{ marginTop: 12, gap: 10 }}>
          {(Object.keys(byMethod) as PaymentMethod[]).map((m) => {
            const v = byMethod[m];
            const w = Math.max(8, Math.round((v / maxMethod) * 220));
            return (
              <View
                key={m}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 12,
                  backgroundColor: colors.card2,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons
                    name="card-outline"
                    size={16}
                    color={colors.muted}
                  />
                  <Text style={{ color: colors.text, fontWeight: "900" }}>
                    {methodLabel(m)}
                  </Text>
                  <Text style={{ color: colors.muted }}>· ${v.toFixed(2)}</Text>
                </View>

                <View
                  style={{
                    height: 10,
                    borderRadius: 999,
                    marginTop: 10,
                    backgroundColor: colors.pillBg,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: w,
                      height: 10,
                      backgroundColor: colors.accentSoft,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="VER VENTAS POR PERIODO"
            onPress={() => router.push("/(tabs)/reports/sales-period" as any)}
            variant="primary"
          />
          <AppButton
            title="VOLVER"
            onPress={() => router.replace("/(tabs)/reports" as any)}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
}
