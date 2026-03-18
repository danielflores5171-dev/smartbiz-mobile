import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { useAuthStore } from "@/src/store/authStore";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

function StatusBanner() {
  const { colors } = useTheme();

  return (
    <View
      style={{
        marginTop: 12,
        marginBottom: 14,
        backgroundColor: colors.card2,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 14,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
        Estado del módulo
      </Text>

      <View
        style={{
          height: 1,
          backgroundColor: colors.divider,
          marginVertical: 12,
        }}
      />

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 99,
            backgroundColor: "#22c55e",
            marginTop: 4,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 15 }}>
            Conectado con web • falta autorización
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>
            Edición base del proveedor con nombre, teléfono y correo ya está
            lista para coincidir con web; falta autorización Bearer/cookies para
            guardar cambios en backend real.
          </Text>
        </View>
      </View>

      <View style={{ height: 12 }} />

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 99,
            backgroundColor: "#f59e0b",
            marginTop: 4,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 15 }}>
            Local/demo • se añadirá en próximas actualizaciones
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>
            Contacto extendido y notas siguen respaldándose en flujo local/demo
            y se integrarán después en la sincronización completa del proveedor.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function SupplierEdit() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const token = useAuthStore((s) => s.token);
  const suppliers = useBusinessStore((s) => s.suppliers);
  const supplier = useMemo(
    () => suppliers.find((s) => s.id === id) ?? null,
    [suppliers, id],
  );

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!supplier) return;
    setName(supplier.name ?? "");
    setContactName(supplier.contactName ?? "");
    setPhone(supplier.phone ?? "");
    setEmail(supplier.email ?? "");
    setNotes(supplier.notes ?? "");
  }, [supplier]);

  async function onSave() {
    if (!supplier) return;

    console.log(
      "[SupplierEdit] save supplierId=",
      supplier.id,
      "businessId=",
      supplier.businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    try {
      await businessActions.updateSupplier(
        supplier.id,
        {
          name: name.trim(),
          contactName: contactName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        token ?? undefined,
      );

      console.log("[SupplierEdit] save OK");

      router.replace({
        pathname: "/business/suppliers/supplier-detail",
        params: { id: supplier.id },
      } as any);
    } catch (e: any) {
      console.log("[SupplierEdit] save FAIL:", String(e));
      Alert.alert("No se pudo guardar", e?.message ?? "Error desconocido");
    }
  }

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
          Editar proveedor
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          {supplier.name}
        </Text>

        <StatusBanner />

        <AppInput label="Nombre" value={name} onChangeText={setName} emphasis />
        <AppInput
          label="Contacto (local / próximamente)"
          value={contactName}
          onChangeText={setContactName}
        />
        <AppInput
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <AppInput
          label="Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label="Notas (local / próximamente)"
          value={notes}
          onChangeText={setNotes}
        />

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="GUARDAR CAMBIOS"
            onPress={onSave}
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
