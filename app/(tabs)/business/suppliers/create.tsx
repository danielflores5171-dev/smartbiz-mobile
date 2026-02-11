import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

export default function SupplierCreate() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const can = name.trim().length >= 2 && !!activeBusinessId;

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
          Crear proveedor
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          (Demo) Se guarda en store local.
        </Text>

        <AppInput
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Proveedor..."
          emphasis
        />
        <AppInput
          label="Contacto (opcional)"
          value={contactName}
          onChangeText={setContactName}
          placeholder="Persona de contacto"
        />
        <AppInput
          label="Teléfono (opcional)"
          value={phone}
          onChangeText={setPhone}
          placeholder="33..."
          keyboardType="phone-pad"
        />
        <AppInput
          label="Correo (opcional)"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@proveedor.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label="Notas (opcional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas..."
        />

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="GUARDAR"
            onPress={async () => {
              if (!can || !activeBusinessId) return;
              await businessActions.createSupplier({
                businessId: activeBusinessId,
                name: name.trim(),
                contactName: contactName.trim() || undefined,
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                notes: notes.trim() || undefined,
              });
              router.replace("/business/suppliers" as any);
            }}
            variant="primary"
            disabled={!can}
          />
          <AppButton
            title="CANCELAR"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
}
