// app/(tabs)/profile/edit-profile.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { useAuthStore } from "@/src/store/authStore";
import { profileActions, useProfileStore } from "@/src/store/profileStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

function isValidEmail(v: string) {
  const x = v.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

export default function EditProfile() {
  const router = useRouter();
  const { colors } = useTheme();

  const authUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const profile = useProfileStore((s) => s.profile);

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? "");

  useEffect(() => {
    void profileActions.bootstrapForAuthUser(
      authUser
        ? {
            id: authUser.id,
            email: authUser.email,
            fullName: authUser.fullName,
          }
        : null,
      token ?? undefined,
    );
  }, [authUser?.id, authUser?.email, token]);

  useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setPhone(profile.phone ?? "");
  }, [profile.updatedAt]);

  const can = useMemo(() => {
    const n = fullName.trim();
    const e = email.trim();
    return n.length >= 2 && isValidEmail(e);
  }, [fullName, email]);

  return (
    <Screen padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>
            Editar perfil
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Actualiza tu información.
          </Text>

          <View
            style={{
              backgroundColor: colors.card2,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 18,
              padding: 14,
              marginTop: 14,
              marginBottom: 8,
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}
            >
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
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
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
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 14,
                  }}
                >
                  Conectado con web • falta autorización
                </Text>
                <Text
                  style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}
                >
                  La edición de nombre, correo, teléfono y actualización del
                  perfil ya coinciden con la web; falta autorización
                  Bearer/cookies para persistencia estable contra backend real.
                </Text>
              </View>
            </View>

            <View style={{ height: 12 }} />

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
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
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 14,
                  }}
                >
                  Local/demo • se añadirá en próximas actualizaciones
                </Text>
                <Text
                  style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}
                >
                  La validación visual del formulario y algunos respaldos de
                  actualización siguen funcionando localmente mientras backend
                  no autoriza o no confirma la escritura remota completa.
                </Text>
              </View>
            </View>
          </View>

          <AppInput
            label="Nombre"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Tu nombre"
            autoCapitalize="words"
          />

          <AppInput
            label="Correo"
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <AppInput
            label="Teléfono (opcional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="33 1234 5678"
            keyboardType={"phone-pad" as any}
          />

          <View style={{ marginTop: 16, gap: 10 }}>
            <AppButton
              title="GUARDAR"
              disabled={!can}
              onPress={async () => {
                if (!can) return;

                console.log(
                  "[EditProfile] save tokenHead=",
                  String(token ?? "").slice(0, 10),
                );

                await profileActions.updateProfile(
                  {
                    fullName: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    phone: phone.trim() || "",
                  },
                  token ?? undefined,
                );

                console.log("[EditProfile] save OK");
                router.replace("/profile/profile" as any);
              }}
              variant="primary"
            />

            <AppButton
              title="CANCELAR"
              onPress={() => router.replace("/profile/profile" as any)}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
