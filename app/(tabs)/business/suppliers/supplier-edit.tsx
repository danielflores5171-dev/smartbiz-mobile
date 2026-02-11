import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

export default function SupplierEdit() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

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
  }, [supplier?.id]);

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

        <AppInput label="Nombre" value={name} onChangeText={setName} emphasis />
        <AppInput
          label="Contacto"
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
        <AppInput label="Notas" value={notes} onChangeText={setNotes} />

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="GUARDAR CAMBIOS"
            onPress={async () => {
              await businessActions.updateSupplier(supplier.id, {
                name: name.trim(),
                contactName: contactName.trim() || undefined,
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                notes: notes.trim() || undefined,
              });

              router.replace({
                pathname: "/business/suppliers/supplier-detail",
                params: { id: supplier.id },
              } as any);
            }}
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
