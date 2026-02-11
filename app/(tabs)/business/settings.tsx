import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const businesses = useBusinessStore((s) => s.businesses);
  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);

  const active = useMemo(() => {
    return businesses.find((b) => b.id === activeBusinessId) ?? null;
  }, [businesses, activeBusinessId]);

  function confirmDelete() {
    if (!active) return;

    Alert.alert(
      "Eliminar negocio",
      "¿Seguro que quieres eliminar este negocio? (demo local)",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await businessActions.deleteBusiness(active.id);
            router.replace("/business" as any);
          },
        },
      ],
    );
  }

  if (!activeBusinessId || !active) {
    return (
      <Screen center padded>
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 16,
            width: "100%",
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>
            Ajustes del negocio
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Primero selecciona o crea un negocio.
          </Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            <AppButton
              title="IR A NEGOCIO"
              onPress={() => router.replace("/business" as any)}
              variant="primary"
            />
            <AppButton
              title="VOLVER"
              onPress={() => router.back()}
              variant="secondary"
            />
          </View>
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
          borderRadius: 20,
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text
              style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}
            >
              Ajustes del negocio
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Configuración y accesos del negocio activo (demo).
            </Text>
          </View>

          <AppButton
            title="VOLVER"
            onPress={() => router.back()}
            variant="secondary"
            fullWidth={false}
          />
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          {active.name}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          {active.address ?? "Sin dirección"}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          {active.email ?? "Sin correo"}{" "}
          {active.phone ? `• ${active.phone}` : ""}
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <View style={{ gap: 10 }}>
          <AppButton
            title="EDITAR NEGOCIO"
            onPress={() =>
              router.push({
                pathname: "/business/edit",
                params: { id: active.id },
              } as any)
            }
            variant="primary"
          />

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
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Cambiar negocio
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Selecciona cuál negocio está activo.
        </Text>

        <View style={{ marginTop: 12, gap: 10 }}>
          {businesses.map((b) => (
            <AppButton
              key={b.id}
              title={b.id === activeBusinessId ? `ACTIVO: ${b.name}` : b.name}
              onPress={() => businessActions.setActiveBusiness(b.id)}
              variant={b.id === activeBusinessId ? "primary" : "secondary"}
            />
          ))}
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <AppButton
          title="ELIMINAR NEGOCIO"
          onPress={confirmDelete}
          variant="secondary"
          style={{
            backgroundColor: "rgba(239,68,68,0.18)",
            borderColor: "rgba(239,68,68,0.35)",
          }}
        />
      </View>
    </Screen>
  );
}
