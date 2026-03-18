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
                La estructura de preferencias de perfil ya está alineada y lista
                para conectarse con la web; falta autorización Bearer/cookies y
                persistencia real de estas preferencias en backend.
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
                El guardado de switches, notificaciones por correo, push y
                resumen semanal siguen funcionando en modo demo/local y se
                integrarán con backend real en futuras actualizaciones.
              </Text>
            </View>
          </View>
        </View>

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
