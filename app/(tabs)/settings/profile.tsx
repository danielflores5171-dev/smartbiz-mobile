// app/(tabs)/settings/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { useProfileStore } from "@/src/store/profileStore";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

export default function SettingsProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const me = useProfileStore((s) => s.profile);

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
            Perfil (demo)
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Información básica de tu cuenta.
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
        <Text style={{ color: colors.muted }}>
          Nombre:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {me?.fullName ?? "—"}
          </Text>
        </Text>

        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Correo:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {me?.email ?? "—"}
          </Text>
        </Text>

        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Estado:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {me?.status?.toUpperCase?.() ?? "—"}
          </Text>
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <Text style={{ color: colors.muted, fontSize: 12 }}>
          Nota: el “editar perfil” completo está en tu módulo Perfil.
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
