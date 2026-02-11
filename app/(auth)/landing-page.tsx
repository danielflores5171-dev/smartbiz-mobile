import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AuthCard from "@/src/ui/AuthCard";
import AuthFrame from "@/src/ui/AuthFrame";

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.inputBorderEmphasis,
        }}
      >
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}>
          {title}
        </Text>
        <Text
          style={{
            color: colors.muted,
            marginTop: 6,
            lineHeight: 18,
            fontSize: 12,
          }}
        >
          {desc}
        </Text>
      </View>
    </View>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <AuthFrame scroll center>
      <AuthCard>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>
          Tu acceso, inteligente.
        </Text>

        <Text
          style={{
            marginTop: 10,
            color: colors.text,
            fontWeight: "900",
            fontSize: 32,
            lineHeight: 36,
          }}
        >
          <Text style={{ color: colors.accent }}>Smart</Text>Biz
        </Text>

        <Text style={{ color: colors.muted, marginTop: 10, lineHeight: 20 }}>
          Tu plataforma para controlar accesos, inventario y personal de forma
          segura e inteligente.
        </Text>

        <View
          style={{
            marginTop: 12,
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.divider,
          }}
        >
          <Text style={{ color: "#93c5fd", fontWeight: "900", fontSize: 12 }}>
            Tu negocio, seguro. Tu acceso, inteligente.
          </Text>
        </View>

        <View
          style={{
            marginTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            paddingTop: 16,
            gap: 10,
          }}
        >
          <AppButton
            title="INICIAR SESIÓN"
            onPress={() => router.push("/(auth)/login" as any)}
            variant="primary"
          />
          <AppButton
            title="REGISTRARME"
            onPress={() => router.push("/(auth)/register" as any)}
            variant="secondary"
          />
        </View>

        <View style={{ marginTop: 16, gap: 12 }}>
          <FeatureRow
            icon="🔒"
            title="Acceso seguro"
            desc="Gestiona el ingreso de empleados con autenticación inteligente."
          />
          <FeatureRow
            icon="📦"
            title="Inventario"
            desc="Visualiza y administra productos en tiempo real."
          />
          <FeatureRow
            icon="📊"
            title="Reportes"
            desc="Estadísticas y gráficos para tomar mejores decisiones."
          />
          <FeatureRow
            icon="🔔"
            title="Notificaciones"
            desc="Alertas sobre movimientos, accesos o productos agotados."
          />
        </View>

        <Text
          style={{
            color: colors.muted,
            textAlign: "center",
            marginTop: 16,
            fontSize: 12,
          }}
        >
          Powered by SmartBiz
        </Text>
      </AuthCard>
    </AuthFrame>
  );
}
