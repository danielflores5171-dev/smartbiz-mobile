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
    );
  }, [authUser?.id, authUser?.email]);

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
            Actualiza tu información (demo).
          </Text>

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

                await profileActions.updateProfile({
                  fullName: fullName.trim(),
                  email: email.trim().toLowerCase(),
                  phone: phone.trim() || "",
                });

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
