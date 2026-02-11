// app/(tabs)/profile/sessions.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

type Session = {
  id: string;
  label: string;
  meta: string;
  isCurrent: boolean;
};

export default function SessionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [sessions, setSessions] = useState<Session[]>([
    { id: "s1", label: "Android · Expo Go", meta: "actual", isCurrent: true },
    { id: "s2", label: "Web · Chrome", meta: "hace 2 días", isCurrent: false },
  ]);

  const currentId = useMemo(
    () => sessions.find((s) => s.isCurrent)?.id ?? null,
    [sessions],
  );

  const [selectedId, setSelectedId] = useState<string | null>(currentId);
  const selected = sessions.find((s) => s.id === selectedId) ?? null;

  function closeSelected() {
    if (!selected) return;
    if (selected.isCurrent) {
      Alert.alert(
        "No disponible",
        "No puedes cerrar la sesión actual desde aquí (demo).",
      );
      return;
    }
    setSessions((prev) => prev.filter((x) => x.id !== selected.id));
  }

  function closeAllExceptSelected() {
    if (!selected) return;
    setSessions((prev) => prev.filter((x) => x.id === selected.id));
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
          Sesiones
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Administra dónde tienes tu sesión iniciada (demo).
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text
          style={{ color: colors.text, fontWeight: "900", marginBottom: 10 }}
        >
          Selecciona una sesión
        </Text>

        <View style={{ gap: 10 }}>
          {sessions.map((s) => {
            const active = s.id === selectedId;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSelectedId(s.id)}
                style={{
                  backgroundColor: colors.pillBg,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.border,
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.accentSoft,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={18}
                      color={colors.icon}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "900" }}>
                      {s.label}
                    </Text>
                    <Text
                      style={{
                        color: colors.muted,
                        marginTop: 3,
                        fontSize: 12,
                      }}
                    >
                      {s.meta}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    {s.isCurrent ? (
                      <Text style={{ color: colors.accent, fontWeight: "900" }}>
                        actual
                      </Text>
                    ) : null}

                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: colors.accent,
                        backgroundColor: active ? colors.accent : colors.pillBg,
                      }}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="CERRAR SESIÓN SELECCIONADA"
            onPress={() =>
              Alert.alert("Cerrar sesión", "¿Cerrar la sesión seleccionada?", [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Cerrar",
                  style: "destructive",
                  onPress: closeSelected,
                },
              ])
            }
            variant="secondary"
          />

          <AppButton
            title="CERRAR TODAS MENOS LA SELECCIONADA"
            onPress={() =>
              Alert.alert(
                "Cerrar sesiones",
                "¿Cerrar todas menos la seleccionada?",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Cerrar",
                    style: "destructive",
                    onPress: closeAllExceptSelected,
                  },
                ],
              )
            }
            variant="secondary"
          />

          <AppButton
            title="CANCELAR"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>

        <View style={{ marginTop: 18, alignItems: "center" }}>
          <Text
            style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}
          >
            Smartbiz ☁️ 2026
          </Text>
        </View>
      </View>
    </Screen>
  );
}
