import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { useAuthStore } from "@/src/store/authStore";
import {
  notificationActions,
  useNotificationStore,
} from "@/src/store/notificationStore";
import ModuleStatusCard from "@/src/ui/ModuleStatusCard";
import Screen from "@/src/ui/Screen";

function fmtAgo(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

function iconFor(kind: string) {
  switch (kind) {
    case "inventory":
      return "cube-outline";
    case "sales":
      return "cart-outline";
    case "business":
      return "business-outline";
    default:
      return "notifications-outline";
  }
}

type Filter = "all" | "unread";

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const token = useAuthStore((s) => s.token);

  const items = useNotificationStore((s) => s.items);
  const loading = useNotificationStore((s) => s.loading);
  const error = useNotificationStore((s) => s.error);

  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = useMemo(
    () => items.filter((x) => !x.read).length,
    [items],
  );

  const filteredItems = useMemo(() => {
    if (filter === "unread") return items.filter((x) => !x.read);
    return items;
  }, [items, filter]);

  const cardStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
  } as const;

  const pillBase = {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card2,
  } as const;

  const actionBtn = {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card2,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  return (
    <Screen scroll padded>
      <View style={cardStyle}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <Text
                style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}
              >
                Notificaciones
              </Text>

              <Pressable
                onPress={() => {
                  if (router.canGoBack()) router.back();
                  else router.replace("/(tabs)/dashboard" as any);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card2,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "900" }}>
                  VOLVER
                </Text>
              </Pressable>
            </View>

            <Text style={{ color: colors.muted, marginTop: 6 }}>
              {unreadCount > 0
                ? `Tienes ${unreadCount} sin leer.`
                : "No tienes pendientes."}
            </Text>
          </View>
        </View>

        <ModuleStatusCard
          connectedText="Listado de notificaciones, lectura individual, marcar como leída y borrado individual ya coinciden con la web; falta autorización Bearer/cookies para operar con backend real."
          demoText="Limpieza total local, fallback de lectura/borrado y respaldo de notificaciones demo mientras backend no autoriza o no existe endpoint completo."
        />

        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <Pressable
            onPress={() => setFilter("all")}
            style={{
              ...pillBase,
              backgroundColor:
                filter === "all" ? colors.pillBgActive : colors.card2,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "900",
                fontSize: 12,
              }}
            >
              TODAS
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilter("unread")}
            style={{
              ...pillBase,
              backgroundColor:
                filter === "unread" ? colors.pillBgActive : colors.card2,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "900",
                fontSize: 12,
              }}
            >
              SIN LEER
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 12, gap: 10, alignItems: "flex-end" }}>
          <Pressable
            onPress={() => {
              if (items.length === 0) return;
              if (unreadCount === 0) return;
              void notificationActions.markAllRead(token ?? undefined);
            }}
            style={{
              ...actionBtn,
              opacity: items.length > 0 && unreadCount > 0 ? 1 : 0.5,
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}
            >
              MARCAR TODO
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (items.length === 0) return;
              Alert.alert(
                "Eliminar todas",
                "Esto limpiará las notificaciones locales de la app. La web no tiene endpoint para borrar todas todavía.",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Limpiar local",
                    style: "destructive",
                    onPress: () => void notificationActions.clearAll(),
                  },
                ],
              );
            }}
            style={{
              ...actionBtn,
              opacity: items.length > 0 ? 1 : 0.5,
            }}
          >
            <Text
              style={{
                color: "rgba(248,113,113,0.95)",
                fontWeight: "900",
                fontSize: 12,
              }}
            >
              ELIMINAR TODAS
            </Text>
          </Pressable>
        </View>

        {error ? (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(248,113,113,0.35)",
            }}
          >
            <Text
              style={{ color: "rgba(248,113,113,0.95)", fontWeight: "900" }}
            >
              Error
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{error}</Text>

            <Pressable
              onPress={() =>
                void notificationActions.refresh(token ?? undefined)
              }
              style={{
                marginTop: 10,
                alignSelf: "flex-start",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: colors.accent,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ marginTop: 14 }}>
          {items.length === 0 && !loading ? (
            <View
              style={{
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card2,
                alignItems: "center",
              }}
            >
              <Ionicons
                name="mail-open-outline"
                size={28}
                color={colors.muted}
              />
              <Text
                style={{ color: colors.text, fontWeight: "900", marginTop: 10 }}
              >
                No hay notificaciones
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                Aquí verás alertas del sistema, ventas e inventario.
              </Text>

              <Pressable
                onPress={() =>
                  void notificationActions.refresh(token ?? undefined)
                }
                style={{
                  marginTop: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "900" }}>
                  REFRESCAR
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ padding: 8 }}>
                {filteredItems.length === 0 ? (
                  <View
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card2,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="checkmark-done-outline"
                      size={26}
                      color={colors.muted}
                    />
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "900",
                        marginTop: 10,
                      }}
                    >
                      No hay sin leer
                    </Text>
                    <Text
                      style={{
                        color: colors.muted,
                        marginTop: 4,
                        textAlign: "center",
                      }}
                    >
                      Ya estás al día 🎉
                    </Text>
                  </View>
                ) : (
                  filteredItems.map((n) => {
                    const isUnread = !n.read;

                    return (
                      <Pressable
                        key={n.id}
                        onPress={() =>
                          router.push(`/notifications/${n.id}` as any)
                        }
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          backgroundColor: isUnread
                            ? colors.pillBgActive
                            : colors.card2,
                          borderWidth: 1,
                          borderColor: colors.border,
                          marginBottom: 8,
                          opacity: loading ? 0.75 : 1,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 12,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: colors.accentSoft,
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          >
                            <Ionicons
                              name={iconFor(n.kind) as any}
                              size={18}
                              color={colors.icon}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                gap: 10,
                              }}
                            >
                              <Text
                                style={{
                                  color: colors.text,
                                  fontWeight: "900",
                                  flex: 1,
                                }}
                                numberOfLines={1}
                              >
                                {n.title}
                              </Text>
                              <Text
                                style={{ color: colors.muted, fontSize: 12 }}
                              >
                                {fmtAgo(n.createdAt)}
                              </Text>
                            </View>

                            <Text
                              style={{ color: colors.muted, marginTop: 4 }}
                              numberOfLines={2}
                            >
                              {n.body}
                            </Text>

                            <View
                              style={{
                                marginTop: 10,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              {isUnread ? (
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <View
                                    style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: 99,
                                      backgroundColor: "#ef4444",
                                    }}
                                  />
                                  <Text
                                    style={{
                                      color: colors.text,
                                      fontWeight: "900",
                                      fontSize: 12,
                                    }}
                                  >
                                    Sin leer
                                  </Text>
                                </View>
                              ) : (
                                <Text
                                  style={{
                                    color: colors.muted,
                                    fontWeight: "800",
                                    fontSize: 12,
                                  }}
                                >
                                  Leído
                                </Text>
                              )}

                              <View style={{ flexDirection: "row", gap: 10 }}>
                                {isUnread ? (
                                  <Pressable
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      void notificationActions.markRead(
                                        n.id,
                                        true,
                                        token ?? undefined,
                                      );
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: colors.text,
                                        fontWeight: "900",
                                        fontSize: 12,
                                      }}
                                    >
                                      MARCAR LEÍDO
                                    </Text>
                                  </Pressable>
                                ) : null}

                                <Pressable
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    Alert.alert(
                                      "Eliminar",
                                      "¿Quieres eliminar esta notificación?",
                                      [
                                        { text: "Cancelar", style: "cancel" },
                                        {
                                          text: "Eliminar",
                                          style: "destructive",
                                          onPress: () =>
                                            void notificationActions.remove(
                                              n.id,
                                              token ?? undefined,
                                            ),
                                        },
                                      ],
                                    );
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: "rgba(248,113,113,0.95)",
                                      fontWeight: "900",
                                      fontSize: 12,
                                    }}
                                  >
                                    ELIMINAR
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
