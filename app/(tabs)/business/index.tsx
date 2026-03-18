import { useTheme } from "@/context/theme-context";
import { useAuthStore } from "@/src/store/authStore";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import ModuleStatusCard from "@/src/ui/ModuleStatusCard";
import Screen from "@/src/ui/Screen";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

export default function BusinessIndex() {
  const router = useRouter();
  const { colors } = useTheme();

  const authUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const businesses = useBusinessStore((s) => s.businesses);
  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const loading = useBusinessStore((s) => s.loading);
  const error = useBusinessStore((s) => s.error);

  const bizHydrated = useBusinessStore((s) => s.hydrated);
  const bizUserId = useBusinessStore((s) => s.userId);

  const hasActive = !!activeBusinessId;

  useEffect(() => {
    if (!authUser?.id) return;

    if (!bizHydrated || bizUserId !== authUser.id) {
      void businessActions.bootstrap(authUser.id, token ?? undefined);
    }
  }, [authUser?.id, bizHydrated, bizUserId, token]);

  console.log(
    "[BusinessIndex] mount userId=",
    authUser?.id,
    "tokenHead=",
    String(token ?? "").slice(0, 10),
    "bizHydrated=",
    bizHydrated,
    "bizUserId=",
    bizUserId,
  );

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

      <ModuleStatusCard
        connectedText="Carga de negocios, activación del negocio actual, estructura de empleados y proveedores, y navegación de gestión ya coinciden con la web; falta autorización Bearer/cookies para consumir backend real."
        demoText="Respaldo local de negocios, persistencia demo, y parte de la experiencia de gestión cuando backend no autoriza o todavía faltan ajustes del lado web."
      />

      {error ? (
        <View
          style={{
            backgroundColor: "rgba(239,68,68,0.12)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.35)",
            padding: 12,
            borderRadius: 14,
            marginBottom: 12,
            marginTop: 12,
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
          marginTop: 12,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          Tus negocios
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
          Toca uno para activarlo. Usa “Editar” para modificar.
        </Text>

        {!loading && businesses.length === 0 ? (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card2,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              Aún no tienes negocios
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
              Crea tu primer negocio para poder usar inventario, ventas y
              reportes.
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 14, gap: 10 }}>
          {businesses.map((b) => {
            const isActive = b.id === activeBusinessId;

            return (
              <Pressable
                key={b.id}
                onPress={() =>
                  businessActions.setActiveBusiness(b.id, token ?? undefined)
                }
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
                      onPress={() =>
                        businessActions.setActiveBusiness(
                          b.id,
                          token ?? undefined,
                        )
                      }
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

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton
            title="CREAR NEGOCIO"
            variant="secondary"
            onPress={() => router.push("/business/create" as any)}
          />

          {hasActive ? (
            <AppButton
              title="DESACTIVAR NEGOCIO"
              variant="secondary"
              onPress={() => businessActions.setActiveBusiness(null)}
            />
          ) : null}
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
          opacity: hasActive ? 1 : 0.5,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          Gestión
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
          Configura empleados y proveedores del negocio activo.
        </Text>

        {!hasActive ? (
          <Text style={{ color: colors.muted, marginTop: 10, fontSize: 12 }}>
            Primero activa un negocio para entrar a esta sección.
          </Text>
        ) : null}

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton
            title="EMPLEADOS"
            onPress={() => {
              if (!hasActive) return;
              router.push("/business/employees" as any);
            }}
            variant="secondary"
          />
          <AppButton
            title="PROVEEDORES"
            onPress={() => {
              if (!hasActive) return;
              router.push("/business/suppliers" as any);
            }}
            variant="secondary"
          />
          <AppButton
            title="AJUSTES DEL NEGOCIO"
            onPress={() => {
              if (!hasActive) return;
              router.push("/business/settings" as any);
            }}
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
