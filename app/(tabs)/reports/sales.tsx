import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { useSalesStore } from "@/src/store/salesStore";
import type { PaymentMethod } from "@/src/types/sales";

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

  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const salesByBusiness = useSalesStore((s) => s.salesByBusiness ?? {});
  const sales = useMemo(() => {
    if (!activeBiz) return [];
    return (salesByBusiness[String(activeBiz.id)] ?? [])
      .slice()
      .sort((a: any, b: any) => {
        const ta = safeDate(a.createdAt)?.getTime() ?? 0;
        const tb = safeDate(b.createdAt)?.getTime() ?? 0;
        return tb - ta;
      });
  }, [salesByBusiness, activeBiz?.id]);

  const last30 = useMemo(() => {
    const min = new Date(daysAgoISO(30)).getTime();
    return sales.filter(
      (s: any) => (safeDate(s.createdAt)?.getTime() ?? 0) >= min,
    );
  }, [sales]);

  const total30 = useMemo(
    () => last30.reduce((acc: number, s: any) => acc + Number(s.total ?? 0), 0),
    [last30],
  );

  const byMethod = useMemo(() => {
    const base: Record<PaymentMethod, number> = {
      cash: 0,
      card: 0,
      transfer: 0,
      other: 0,
    };

    // ✅ FIX: valida paymentMethod
    for (const s of last30) {
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
  }, [last30]);

  const maxMethod = useMemo(
    () => Math.max(1, ...Object.values(byMethod)),
    [byMethod],
  );

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
          Últimos 30 días (demo).
        </Text>

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
              {last30.length}
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
