// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItem,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Redirect, usePathname, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // ✅ ADD

import { useTheme } from "@/context/theme-context";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import { useDashboardWidgetsStore } from "@/src/store/dashboardWidgetsStore";
import {
  notificationActions,
  useNotificationStore,
} from "@/src/store/notificationStore";
import { profileActions, useProfileStore } from "@/src/store/profileStore";

// ✅ AUTH
import { authActions, useAuthStore } from "@/src/store/authStore";

// ✅ SALES bootstrap por usuario
import { salesActions } from "@/src/store/salesStore";

type Item = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  href: string;
};

type DrawerIconArgs = { focused: boolean; color: string; size: number };

function SmartBizDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); // ✅ ADD

  // ✅ IMPORTANTE: NO uses "/(tabs)" en href.
  const items: Item[] = [
    { label: "Dashboard", icon: "grid-outline", href: "/dashboard" },
    { label: "Negocio", icon: "business-outline", href: "/business" },
    { label: "Inventario", icon: "cube-outline", href: "/inventory" },
    { label: "Ventas", icon: "cart-outline", href: "/sales" },
    { label: "Reportes", icon: "bar-chart-outline", href: "/reports" },
    {
      label: "Notificaciones",
      icon: "notifications-outline",
      href: "/notifications",
    },
    { label: "Configuración", icon: "settings-outline", href: "/settings" },
  ];

  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );
  const hasBiz = !!activeBiz;

  const me = useProfileStore((s) => s.profile);
  const userName = me?.fullName ?? "Usuario";
  const userEmail = me?.email ?? "—";

  const rawPath = typeof pathname === "string" ? pathname : "";

  const bizStatus = (activeBiz as any)?.status ?? "active";
  const isActiveBiz = bizStatus === "active";
  const statusDot = isActiveBiz ? "#22c55e" : "#ef4444";
  const statusText = isActiveBiz ? "Activo" : "Inactivo";

  return (
    <View style={{ flex: 1, backgroundColor: colors.screenBg }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          // ✅ FIX: respeta notch/cámara/hora
          paddingTop: insets.top + 12,
          paddingHorizontal: 12,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        {/* Header usuario */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="person-outline" size={22} color={colors.icon} />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}
              >
                {userName}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 2, fontSize: 12 }}>
                {userEmail}
              </Text>

              {hasBiz ? (
                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <Pressable
                    onPress={() => router.push("/business" as any)}
                    style={{
                      flex: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 14,
                      backgroundColor: colors.card2,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color={colors.icon}
                    />
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "800",
                        fontSize: 12,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {activeBiz?.name}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={colors.muted}
                    />
                  </Pressable>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 14,
                      backgroundColor: colors.card2,
                      borderWidth: 1,
                      borderColor: colors.border,
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
                        backgroundColor: statusDot,
                      }}
                    />
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "900",
                        fontSize: 12,
                      }}
                    >
                      {statusText}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Menu */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            paddingVertical: 10,
            overflow: "hidden",
          }}
        >
          {items.map((it) => {
            const isActive = rawPath.startsWith(it.href);
            return (
              <DrawerItem
                key={it.href}
                label={it.label}
                onPress={() => router.push(it.href as any)}
                focused={isActive}
                labelStyle={{
                  marginLeft: -10,
                  fontSize: 14,
                  fontWeight: "800",
                  color: colors.text,
                }}
                style={{
                  marginHorizontal: 6,
                  borderRadius: 14,
                  backgroundColor: isActive
                    ? colors.pillBgActive
                    : "transparent",
                }}
                icon={(args: DrawerIconArgs) => (
                  <Ionicons
                    name={it.icon}
                    size={args.size ?? 18}
                    color={colors.icon}
                  />
                )}
              />
            );
          })}
        </View>

        <View style={{ height: 18 }} />
      </DrawerContentScrollView>

      {/* Footer fijo */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          paddingBottom: Math.max(insets.bottom, 12), // ✅ opcional: se ve más pro
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          SmartBiz ☁ 2026
        </Text>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const authUser = useAuthStore((s) => s.user);

  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const unread = useNotificationStore(
    (s) => (s.items ?? []).filter((x) => !x.read).length,
  );

  useEffect(() => {
    void authActions.bootstrap();
  }, []);

  useEffect(() => {
    if (!hydrated || !token) return;

    if (authUser?.id) void businessActions.bootstrap(authUser.id);
    void useDashboardWidgetsStore.getState().hydrate();

    if (authUser) void profileActions.bootstrapForAuthUser(authUser);

    if (authUser?.id) {
      void notificationActions.bootstrap(authUser.id);
      void salesActions.bootstrap(authUser.id);
    }
  }, [hydrated, token, authUser?.id]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.screenBg,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ marginTop: 10, color: colors.muted, fontWeight: "800" }}>
          Cargando sesión…
        </Text>
      </View>
    );
  }

  if (!token) return <Redirect href="/(auth)/login" />;

  const activeBusinessName = activeBiz?.name ?? "";
  const hasBiz = !!activeBiz;

  return (
    <Drawer
      drawerContent={(p: DrawerContentComponentProps) => (
        <SmartBizDrawerContent {...p} />
      )}
      screenOptions={{
        headerStyle: { backgroundColor: colors.screenBg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "900" },
        headerShadowVisible: false,

        headerTitle: () => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="cloud-outline" size={18} color={colors.text} />
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}
            >
              SmartBiz
            </Text>
          </View>
        ),

        headerRight: () => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingRight: 12,
            }}
          >
            {hasBiz ? (
              <Pressable
                onPress={() => router.push("/business" as any)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  maxWidth: 160,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                  numberOfLines={1}
                >
                  {activeBusinessName}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.text} />
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => router.push("/notifications" as any)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.card,
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color={colors.text}
              />
              {unread > 0 ? (
                <View
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 4,
                    borderRadius: 999,
                    backgroundColor: "#ef4444",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}
                  >
                    {unread > 9 ? "9+" : String(unread)}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              onPress={() => router.push("/profile/profile" as any)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.card,
              }}
            >
              <Ionicons name="person-outline" size={18} color={colors.text} />
            </Pressable>
          </View>
        ),
      }}
    >
      <Drawer.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Drawer.Screen name="business" options={{ title: "Negocio" }} />
      <Drawer.Screen name="inventory" options={{ title: "Inventario" }} />
      <Drawer.Screen name="sales" options={{ title: "Ventas" }} />
      <Drawer.Screen name="reports" options={{ title: "Reportes" }} />
      <Drawer.Screen name="settings" options={{ title: "Configuración" }} />
      <Drawer.Screen
        name="notifications"
        options={{ title: "Notificaciones" }}
      />
      <Drawer.Screen name="profile/profile" options={{ title: "Perfil" }} />
    </Drawer>
  );
}
