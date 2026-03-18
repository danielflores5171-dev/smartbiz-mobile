import { useRouter } from "expo-router";
import React, { useState } from "react";
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
            Alta de proveedor con nombre, teléfono y correo ya está preparada
            para coincidir con web y backend; falta autorización Bearer/cookies
            para operar de forma completa en entorno real.
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
            Contacto de referencia y notas siguen funcionando como apoyo
            local/demo y se integrarán después en la sincronización completa con
            web.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function SupplierCreate() {
  const router = useRouter();
  const { colors } = useTheme();

  const token = useAuthStore((s) => s.token);
  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const can = name.trim().length >= 2 && !!activeBusinessId;

  async function onSave() {
    if (!can || !activeBusinessId) return;

    console.log(
      "[SupplierCreate] save businessId=",
      activeBusinessId,
      "name=",
      name.trim(),
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    try {
      await businessActions.createSupplier(
        {
          businessId: activeBusinessId,
          name: name.trim(),
          contactName: contactName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        token ?? undefined,
      );

      console.log("[SupplierCreate] save OK");
      router.replace("/business/suppliers" as any);
    } catch (e: any) {
      console.log("[SupplierCreate] save FAIL:", String(e));
      Alert.alert("No se pudo guardar", e?.message ?? "Error desconocido");
    }
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
          Crear proveedor
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Se sincroniza con web usando nombre, teléfono y correo. Contacto y
          notas quedan locales por ahora.
        </Text>

        <StatusBanner />

        <AppInput
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Proveedor..."
          emphasis
        />
        <AppInput
          label="Contacto (local / próximamente)"
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
          label="Notas (local / próximamente)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas..."
        />

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="GUARDAR"
            onPress={onSave}
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
