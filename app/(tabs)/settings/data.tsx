// app/(tabs)/settings/data.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

export default function SettingsDataScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const resetAllDemo = () => {
    Alert.alert(
      "Reiniciar datos (demo)",
      "Esto borrará TODO lo guardado localmente por SmartBiz (smartbiz.*) y cerrará sesión.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const keys = await AsyncStorage.getAllKeys();
              const toRemove = keys.filter((k) => k.startsWith("smartbiz."));
              if (toRemove.length) await AsyncStorage.multiRemove(toRemove);

              Alert.alert(
                "Listo",
                "Datos borrados. Reinicia la app con -c si ves cache raro.",
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/(auth)/login" as any),
                  },
                ],
              );
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo borrar.");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

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
            Datos (demo)
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Limpieza y reinicio local.
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
          Reiniciar SmartBiz (local)
        </Text>
        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 18 }}>
          Borra usuarios demo, sesión, settings, y cualquier store guardado en
          AsyncStorage.
        </Text>

        <View style={{ marginTop: 16 }}>
          <AppButton
            title={loading ? "BORRANDO..." : "BORRAR TODO (smartbiz.*)"}
            variant="danger"
            onPress={resetAllDemo}
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <AppButton
            title="VOLVER"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </Screen>
  );
}
