import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

export default function SuppliersList() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const allSuppliers = useBusinessStore((s) => s.suppliers);

  const suppliers = useMemo(() => {
    if (!activeBusinessId) return [];
    return allSuppliers.filter((x) => x.businessId === activeBusinessId);
  }, [allSuppliers, activeBusinessId]);

  useEffect(() => {
    if (!activeBusinessId) return;
    void businessActions.loadSuppliers(activeBusinessId);
  }, [activeBusinessId]);

  if (!activeBusinessId) {
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
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            Primero selecciona un negocio.
          </Text>
          <View style={{ marginTop: 12 }}>
            <AppButton
              title="IR A NEGOCIO"
              onPress={() => router.replace("/business" as any)}
              variant="primary"
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
              style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}
            >
              Proveedores
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Lista y administración de proveedores.
            </Text>
          </View>

          <AppButton
            title="VOLVER"
            onPress={() => router.back()}
            variant="secondary"
            fullWidth={false}
          />
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton
            title="CREAR PROVEEDOR"
            onPress={() => router.push("/business/suppliers/create" as any)}
            variant="primary"
          />
          <AppButton
            title="REFRESCAR"
            onPress={() =>
              void businessActions.refreshSuppliers(activeBusinessId)
            }
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

        <Text
          style={{ color: colors.text, fontWeight: "900", marginBottom: 8 }}
        >
          Lista
        </Text>

        <View style={{ gap: 10 }}>
          {suppliers.map((s) => (
            <Pressable
              key={s.id}
              onPress={() =>
                router.push({
                  pathname: "/business/suppliers/supplier-detail",
                  params: { id: s.id },
                } as any)
              }
              style={{
                backgroundColor: colors.card2,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text
                style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}
              >
                {s.name}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
                {s.phone ?? "Sin teléfono"} • {s.email ?? "Sin correo"}
              </Text>
            </Pressable>
          ))}

          {suppliers.length === 0 ? (
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              (Aún no hay proveedores)
            </Text>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
