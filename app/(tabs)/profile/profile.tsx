// app/(tabs)/profile/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { profileActions, useProfileStore } from "@/src/store/profileStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const token = useAuthStore((s) => s.token);
  const me = useProfileStore((s) => s.profile);
  const loading = useProfileStore((s) => s.loading);
  const status = (me as any)?.status ?? "active";

  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const statusLabel = status === "active" ? "Activo" : "Inactivo";
  const dotColor = status === "active" ? colors.successText : colors.dangerText;

  async function pickAvatar() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as any,
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if ((result as any).canceled) return;

      const uri = (result as any).assets?.[0]?.uri;
      if (!uri) return;

      console.log(
        "[ProfileScreen] set avatar tokenHead=",
        String(token ?? "").slice(0, 10),
      );

      await profileActions.setAvatar(uri, token ?? undefined);
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
          console.log(
            "[ProfileScreen] remove avatar tokenHead=",
            String(token ?? "").slice(0, 10),
          );
          await profileActions.setAvatar(undefined, token ?? undefined);
        },
      },
    ]);
  }

  const avatarSrc = me.avatarUrl || me.avatarUri;

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
          Administra tu cuenta y preferencias.
        </Text>

        <View
          style={{
            backgroundColor: colors.card2,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            padding: 14,
            marginTop: 14,
            marginBottom: 6,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
            Estado del módulo
          </Text>

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              marginVertical: 12,
            }}
          />

          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 99,
                backgroundColor: "#22c55e",
                marginTop: 4,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}
              >
                Conectado con web • falta autorización
              </Text>
              <Text
                style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}
              >
                La lectura del perfil, actualización de avatar, estructura de
                cuenta y navegación a opciones ya están alineadas con la web;
                falta autorización Bearer/cookies para operar totalmente sobre
                backend real.
              </Text>
            </View>
          </View>

          <View style={{ height: 12 }} />

          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 99,
                backgroundColor: "#f59e0b",
                marginTop: 4,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}
              >
                Local/demo • se añadirá en próximas actualizaciones
              </Text>
              <Text
                style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}
              >
                Parte del flujo visual del perfil y algunos respaldos de estado
                siguen funcionando localmente mientras se completa la
                persistencia remota total en próximas actualizaciones.
              </Text>
            </View>
          </View>
        </View>

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
              {avatarSrc ? (
                <Image
                  source={{ uri: avatarSrc }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person-outline" size={44} color={colors.icon} />
              )}
            </Pressable>

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

          {avatarSrc ? (
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
