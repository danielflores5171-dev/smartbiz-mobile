// app/(tabs)/profile/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { profileActions, useProfileStore } from "@/src/store/profileStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const me = useProfileStore((s) => s.profile);
  const status = (me as any)?.status ?? "active";
  const loading = useProfileStore((s) => s.loading);

  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const statusLabel = status === "active" ? "Activo" : "Inactivo";
  const dotColor = status === "active" ? colors.successText : colors.dangerText;

  async function pickAvatar() {
    try {
      const { status: perm } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Activa el permiso a fotos para elegir tu avatar.",
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (res.canceled) return;

      const uri = res.assets?.[0]?.uri;
      if (!uri) return;

      await profileActions.setAvatar(uri);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo elegir la imagen");
    }
  }

  function removeAvatar() {
    Alert.alert("Quitar foto", "¿Quieres quitar tu foto de perfil?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar",
        style: "destructive",
        onPress: async () => {
          await profileActions.setAvatar(undefined);
        },
      },
    ]);
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
          Perfil
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Administra tu cuenta y preferencias (demo).
        </Text>

        {/* Avatar centrado */}
        <View style={{ alignItems: "center", marginTop: 18 }}>
          <View style={{ position: "relative" }}>
            <Pressable
              onPress={pickAvatar}
              style={{
                width: 104,
                height: 104,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {me.avatarUri ? (
                <Image
                  source={{ uri: me.avatarUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person-outline" size={44} color={colors.icon} />
              )}
            </Pressable>

            {/* Lapicito */}
            <Pressable
              onPress={pickAvatar}
              hitSlop={12}
              style={{
                position: "absolute",
                right: -6,
                bottom: -6,
                width: 36,
                height: 36,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.pillBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="pencil" size={16} color={colors.text} />
            </Pressable>
          </View>

          <Text
            style={{
              color: colors.text,
              fontWeight: "900",
              fontSize: 18,
              marginTop: 12,
            }}
          >
            {me.fullName}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{me.email}</Text>

          <View
            style={{
              marginTop: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.pillBg,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                backgroundColor: dotColor,
              }}
            />
            <Text
              style={{ color: colors.muted, fontWeight: "800", fontSize: 12 }}
            >
              {statusLabel}
            </Text>
          </View>

          <Text style={{ color: colors.muted, marginTop: 10, fontSize: 12 }}>
            Negocio:{" "}
            <Text style={{ color: colors.text, fontWeight: "800" }}>
              {activeBiz?.name ?? "—"}
            </Text>
          </Text>

          {me.phone ? (
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
              Teléfono:{" "}
              <Text style={{ color: colors.text, fontWeight: "800" }}>
                {me.phone}
              </Text>
            </Text>
          ) : null}
        </View>

        <View style={{ marginTop: 18, gap: 10 }}>
          <AppButton
            title="EDITAR PERFIL"
            onPress={() => router.push("/profile/edit-profile" as any)}
            variant="primary"
          />
          <AppButton
            title="CAMBIAR CONTRASEÑA"
            onPress={() => router.push("/profile/change-password" as any)}
            variant="secondary"
          />
          <AppButton
            title="SESIONES"
            onPress={() => router.push("/profile/sessions" as any)}
            variant="secondary"
          />
          <AppButton
            title="AJUSTES DE PERFIL"
            onPress={() => router.push("/profile/profile-settings" as any)}
            variant="secondary"
          />
          <AppButton
            title="CERRAR SESIÓN"
            onPress={() => router.push("/profile/logout" as any)}
            variant="secondary"
            style={{
              backgroundColor: colors.accentSoft,
              borderColor: colors.border,
            }}
          />

          {me.avatarUri ? (
            <AppButton
              title="QUITAR FOTO"
              onPress={removeAvatar}
              variant="secondary"
              disabled={loading}
            />
          ) : null}

          <Pressable
            onPress={() => router.replace("/dashboard" as any)}
            style={{ alignSelf: "center", marginTop: 6, paddingVertical: 8 }}
          >
            <Text style={{ color: colors.accent, fontWeight: "900" }}>
              VOLVER
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            SmartBiz ☁️ 2026
          </Text>
        </View>
      </View>
    </Screen>
  );
}
