// app/index.tsx
import { Redirect } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { authActions, useAuthStore } from "@/src/store/authStore";

export default function Index() {
  const { colors } = useTheme();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    void authActions.bootstrap();
  }, []);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.screenBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ marginTop: 10, color: colors.muted, fontWeight: "800" }}>
          Cargando…
        </Text>
      </View>
    );
  }

  return (
    <Redirect href={token ? "/(tabs)/dashboard" : "/(auth)/landing-page"} />
  );
}
