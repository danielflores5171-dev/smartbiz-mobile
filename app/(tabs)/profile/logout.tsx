// app/(tabs)/profile/logout.tsx
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { authActions } from "@/src/store/authStore";
import { notificationActions } from "@/src/store/notificationStore";
import { profileActions } from "@/src/store/profileStore";

export default function LogoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = React.useState(false);

  const doLogout = async () => {
    if (loading) return;

    Alert.alert("Cerrar sesión", "¿Seguro que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            notificationActions.clearLocal?.();
            profileActions.resetLocal?.();

            await authActions.logout();

            router.replace("/(auth)/login" as any); // ✅ no es /(tabs)
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "No se pudo cerrar sesión.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen padded>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          padding: 18,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>
          Cerrar sesión
        </Text>

        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 18 }}>
          Esto cerrará tu sesión y te regresará al login.
        </Text>

        <View style={{ marginTop: 16 }}>
          <AppButton
            title={loading ? "CERRANDO..." : "CONFIRMAR CIERRE"}
            onPress={doLogout}
            variant="primary"
            disabled={loading}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <AppButton
            title="VOLVER"
            variant="secondary"
            onPress={() => router.back()}
            disabled={loading}
          />
        </View>

        {loading ? (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
