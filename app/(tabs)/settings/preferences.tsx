// app/(tabs)/settings/preferences.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

export default function SettingsPreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen padded>
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
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
            Preferencias (demo)
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Configuración adicional.
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
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Próximamente
        </Text>
        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 18 }}>
          Aquí podemos agregar: vibración, sonidos, accesibilidad, etc.
        </Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <AppButton
          title="VOLVER"
          variant="secondary"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}
