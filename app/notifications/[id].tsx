// app/(tabs)/notifications/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import {
  notificationActions,
  useNotificationStore,
} from "@/src/store/notificationStore";
import Screen from "@/src/ui/Screen";

function fmtFull(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function normalizeParamId(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return null;
}

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const id = normalizeParamId((params as any)?.id);

  const item = useNotificationStore((s) =>
    id ? (s.items.find((x) => x.id === id) ?? null) : null,
  );

  const title = useMemo(() => item?.title ?? "Notificación", [item?.title]);

  // ✅ fija TS: saca el route a variable (queda string | undefined)
  const route = item?.meta?.route;

  useEffect(() => {
    if (!item) return;
    if (!item.read) {
      void notificationActions.markRead(item.id, true);
    }
  }, [item?.id, item?.read]);

  if (!id || !item) {
    return (
      <Screen padded>
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
            No encontrada
          </Text>
          <Text style={{ color: colors.muted, marginTop: 8 }}>
            Esta notificación ya no existe o fue eliminada.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 14,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: colors.accent,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>VOLVER</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 20,
              fontWeight: "900",
              flex: 1,
            }}
            numberOfLines={2}
          >
            {title}
          </Text>

          <Pressable
            onPress={() => {
              Alert.alert("Eliminar", "¿Eliminar esta notificación?", [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Eliminar",
                  style: "destructive",
                  onPress: async () => {
                    await notificationActions.remove(item.id);
                    router.back();
                  },
                },
              ]);
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={"rgba(248,113,113,0.95)"}
            />
          </Pressable>
        </View>

        <Text style={{ color: colors.muted, marginTop: 8 }}>
          {fmtFull(item.createdAt)}
        </Text>

        <View style={{ height: 12 }} />

        <View
          style={{
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card2,
          }}
        >
          <Text style={{ color: colors.text, lineHeight: 20 }}>
            {item.body}
          </Text>
        </View>

        <View style={{ height: 14 }} />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card2,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              VOLVER
            </Text>
          </Pressable>

          {route ? (
            <Pressable
              onPress={() => router.push(route as any)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: colors.accent,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                IR AL MÓDULO
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
