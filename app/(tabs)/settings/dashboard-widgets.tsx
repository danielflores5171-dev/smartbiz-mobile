// app/(tabs)/settings/dashboard-widgets.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import {
    useDashboardWidgetsStore,
    type DashboardWidgetKey,
} from "@/src/store/dashboardWidgetsStore";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

const LABELS: Record<
  DashboardWidgetKey,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }
> = {
  tp_revenue: {
    title: "Top productos: Ingresos",
    subtitle: "Ranking por $ (reportes).",
    icon: "trending-up-outline",
  },
  tp_qty: {
    title: "Top productos: Cantidad",
    subtitle: "Ranking por unidades (reportes).",
    icon: "stats-chart-outline",
  },
  sp_total_by_day: {
    title: "Ventas por periodo: Total por día",
    subtitle: "Línea/área (últimos 14 días).",
    icon: "pulse-outline",
  },
  sp_count_by_day: {
    title: "Ventas por periodo: Conteo por día",
    subtitle: "Barras compactas (últimos 14 días).",
    icon: "podium-outline",
  },
};

function Row({
  k,
  title,
  subtitle,
  icon,
  enabled,
  onToggle,
}: {
  k: DashboardWidgetKey;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  enabled: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card2,
        borderRadius: 16,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.icon} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: colors.muted, marginTop: 3, fontSize: 12 }}>
          {subtitle}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: enabled ? "rgba(34,197,94,0.18)" : colors.card,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}>
          {enabled ? "ON" : "OFF"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function DashboardWidgetsSettings() {
  const router = useRouter();
  const { colors } = useTheme();

  const hydrated = useDashboardWidgetsStore((s) => s.hydrated);
  const enabled = useDashboardWidgetsStore((s) => s.enabled);
  const toggle = useDashboardWidgetsStore((s) => s.toggle);
  const hydrate = useDashboardWidgetsStore((s) => s.hydrate);
  const persist = useDashboardWidgetsStore((s) => s.persist);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  const handleToggle = (k: DashboardWidgetKey) => {
    toggle(k);
    void persist();
  };

  return (
    <Screen scroll padded>
      {/* Header */}
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
            backgroundColor: colors.card,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900" }}>
            Widgets del Dashboard
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Activa o desactiva tarjetas y gráficas (persistente).
          </Text>
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
          gap: 10,
        }}
      >
        {(Object.keys(LABELS) as DashboardWidgetKey[]).map((k) => (
          <Row
            key={k}
            k={k}
            title={LABELS[k].title}
            subtitle={LABELS[k].subtitle}
            icon={LABELS[k].icon}
            enabled={!!enabled?.[k]}
            onToggle={() => handleToggle(k)}
          />
        ))}
      </View>

      <View style={{ marginTop: 16, gap: 10 }}>
        <AppButton
          title="VOLVER"
          variant="secondary"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}
