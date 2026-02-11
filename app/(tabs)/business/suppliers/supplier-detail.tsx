import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

export default function SupplierDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const suppliers = useBusinessStore((s) => s.suppliers);
  const supplier = useMemo(
    () => suppliers.find((s) => s.id === id) ?? null,
    [suppliers, id],
  );

  if (!supplier) {
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
            Proveedor no encontrado.
          </Text>
          <View style={{ marginTop: 12 }}>
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
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>
          {supplier.name}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          {supplier.contactName ?? "Sin contacto"}
        </Text>

        <View style={{ marginTop: 12 }}>
          <Info label="Teléfono" value={supplier.phone ?? "—"} />
          <Info label="Correo" value={supplier.email ?? "—"} />
          <Info label="Notas" value={supplier.notes ?? "—"} />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="EDITAR"
            onPress={() =>
              router.push({
                pathname: "/business/suppliers/supplier-edit",
                params: { id: supplier.id },
              } as any)
            }
            variant="primary"
          />
          <AppButton
            title="ELIMINAR"
            onPress={async () => {
              await businessActions.deleteSupplier(supplier.id);
              router.replace("/business/suppliers" as any);
            }}
            variant="secondary"
            style={{
              backgroundColor: "rgba(239,68,68,0.18)",
              borderColor: "rgba(239,68,68,0.35)",
            }}
          />
          <AppButton
            title="VOLVER"
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>
      </View>
    </Screen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "800", marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}
