import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Switch, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [weekly, setWeekly] = useState(false);

  function Row({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ paddingRight: 10, flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900" }}>{label}</Text>
          <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
            (demo) se guarda después con backend.
          </Text>
        </View>

        <Switch value={value} onValueChange={onChange} />
      </View>
    );
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
          Ajustes de perfil
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Personaliza tus notificaciones (demo).
        </Text>

        <View style={{ marginTop: 12 }}>
          <Row
            label="Notificaciones por correo"
            value={emailNotifs}
            onChange={setEmailNotifs}
          />
          <Row
            label="Notificaciones push"
            value={pushNotifs}
            onChange={setPushNotifs}
          />
          <Row label="Resumen semanal" value={weekly} onChange={setWeekly} />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="GUARDAR"
            onPress={() => router.back()}
            variant="primary"
          />
          <AppButton
            title="CANCELAR"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
}
