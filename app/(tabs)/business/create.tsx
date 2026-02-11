import { useTheme } from "@/context/theme-context";
import { businessActions } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";

export default function BusinessCreate() {
  const router = useRouter();
  const { colors } = useTheme();

  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  async function onCreate() {
    if (!name.trim()) return;

    await businessActions.createBusiness({
      name: name.trim(),
      legalName: legalName.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    } as any);

    router.back();
  }

  return (
    <Screen scroll padded>
      <View style={{ marginTop: 6, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 22 }}>
          Crear negocio
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Completa la información básica (modo demo, luego API).
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 22,
          padding: 16,
        }}
      >
        <AppInput
          label="Nombre del negocio"
          value={name}
          onChangeText={setName}
          placeholder="Ej: Negocio X"
          emphasis
        />
        <AppInput
          label="Razón social (opcional)"
          value={legalName}
          onChangeText={setLegalName}
          placeholder="Ej: Negocio X S.A. de C.V."
        />
        <AppInput
          label="Teléfono (opcional)"
          value={phone}
          onChangeText={setPhone}
          placeholder="33 0000 0000"
          keyboardType="phone-pad"
        />
        <AppInput
          label="Correo (opcional)"
          value={email}
          onChangeText={setEmail}
          placeholder="negocio@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label="Dirección (opcional)"
          value={address}
          onChangeText={setAddress}
          placeholder="Guadalajara, Jalisco"
        />

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton title="GUARDAR" variant="primary" onPress={onCreate} />
          <AppButton
            title="CANCELAR"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </Screen>
  );
}
