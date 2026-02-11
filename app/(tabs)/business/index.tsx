import { useTheme } from "@/context/theme-context";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

export default function BusinessIndex() {
  const router = useRouter();
  const { colors } = useTheme();

  const businesses = useBusinessStore((s) => s.businesses);
  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const loading = useBusinessStore((s) => s.loading);
  const error = useBusinessStore((s) => s.error);

  useEffect(() => {
    if (!businesses.length && !loading) void businessActions.bootstrap();
  }, [businesses.length, loading]);

  return (
    <Screen scroll padded>
      <View style={{ marginTop: 6, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 22 }}>
          Negocio
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Administra tus negocios, empleados y proveedores.
        </Text>
      </View>

      {error ? (
        <View
          style={{
            backgroundColor: "rgba(239,68,68,0.12)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.35)",
            padding: 12,
            borderRadius: 14,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "800" }}>{error}</Text>
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 22,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          Tus negocios
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
          Toca uno para activarlo. Usa “Editar” para modificar.
        </Text>

        <View style={{ marginTop: 14, gap: 10 }}>
          {businesses.map((b) => {
            const isActive = b.id === activeBusinessId;

            return (
              <Pressable
                key={b.id}
                onPress={() => businessActions.setActiveBusiness(b.id)}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: isActive
                    ? colors.inputBorderEmphasis
                    : colors.border,
                  backgroundColor: isActive
                    ? colors.pillBgActive
                    : colors.card2,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 15,
                  }}
                >
                  {b.name}
                </Text>
                <Text
                  style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}
                >
                  {b.address ?? "—"}
                </Text>

                <View style={{ marginTop: 10, flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      title={isActive ? "ACTIVO" : "ACTIVAR"}
                      variant="primary"
                      onPress={() => businessActions.setActiveBusiness(b.id)}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <AppButton
                      title="EDITAR"
                      variant="secondary"
                      onPress={() =>
                        router.push({
                          pathname: "/business/edit",
                          params: { id: b.id },
                        } as any)
                      }
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 14 }}>
          <AppButton
            title="CREAR NEGOCIO"
            variant="secondary"
            onPress={() => router.push("/business/create" as any)}
          />
        </View>
      </View>

      <View
        style={{
          marginTop: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 22,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          Gestión
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
          Configura empleados y proveedores del negocio activo.
        </Text>

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton
            title="EMPLEADOS"
            onPress={() => router.push("/business/employees" as any)}
            variant="secondary"
          />
          <AppButton
            title="PROVEEDORES"
            onPress={() => router.push("/business/suppliers" as any)}
            variant="secondary"
          />
          <AppButton
            title="AJUSTES DEL NEGOCIO"
            onPress={() => router.push("/business/settings" as any)}
            variant="secondary"
          />
        </View>
      </View>

      <Text
        style={{
          color: colors.muted,
          textAlign: "center",
          marginTop: 14,
          fontSize: 12,
        }}
      >
        SmartBiz ☁ 2026
      </Text>
    </Screen>
  );
}
