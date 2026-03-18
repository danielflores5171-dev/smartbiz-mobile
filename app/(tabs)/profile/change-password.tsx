import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

import { profileActions, useProfileStore } from "@/src/store/profileStore";

export default function ChangePassword() {
  const router = useRouter();
  const { colors } = useTheme();

  const loading = useProfileStore((s) => s.loading);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const can = useMemo(() => {
    if (!currentPassword.trim()) return false;
    if (newPassword.trim().length < 6) return false;
    if (newPassword.trim() !== confirm.trim()) return false;
    return true;
  }, [currentPassword, newPassword, confirm]);

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
            Cambiar contraseña
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            (Demo) La contraseña actual válida es: 123456
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
                  La estructura de cambio de contraseña y su ruta ya están
                  preparadas para integrarse con la web; falta autorización
                  Bearer/cookies y activación del endpoint real de seguridad.
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
                  La validación de contraseña actual, confirmación y guardado
                  siguen operando en modo demo/local y se conectarán a backend
                  real en futuras actualizaciones.
                </Text>
              </View>
            </View>
          </View>

          <AppInput
            label="Contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          <AppInput
            label="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            autoCapitalize="none"
          />

          <AppInput
            label="Confirmar nueva contraseña"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repite la contraseña"
            secureTextEntry
            autoCapitalize="none"
          />

          <View style={{ marginTop: 16, gap: 10 }}>
            <AppButton
              title={loading ? "GUARDANDO..." : "GUARDAR"}
              disabled={!can || loading}
              onPress={async () => {
                if (!can) return;

                try {
                  await profileActions.changePassword({
                    currentPassword: currentPassword.trim(),
                    newPassword: newPassword.trim(),
                  });

                  Alert.alert("Listo", "Contraseña actualizada (demo).", [
                    {
                      text: "OK",
                      onPress: () => router.replace("/profile/profile" as any),
                    },
                  ]);
                } catch (e: any) {
                  Alert.alert("Error", e?.message ?? "No se pudo cambiar");
                }
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
