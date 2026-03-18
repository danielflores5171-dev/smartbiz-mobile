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
    const cleanName = name.trim();
    if (!cleanName) return;

    await businessActions.createBusiness({
      name: cleanName,
      legalName: legalName.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    });

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
          backgroundColor: colors.card2,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          Estado del módulo
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 12,
          }}
        />

        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
        >
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
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}
            >
              Conectado con web • falta autorización
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}>
              La estructura de alta de negocio, captura de datos principales y
              persistencia hacia backend ya coinciden con la web; falta
              autorización Bearer/cookies y activación completa del endpoint
              real.
            </Text>
          </View>
        </View>

        <View style={{ height: 12 }} />

        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
        >
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
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}
            >
              Local/demo • se añadirá en próximas actualizaciones
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}>
              La validación visual del formulario y el guardado de respaldo
              local siguen operando en demo mientras backend no autoriza o no
              termina de responder con persistencia remota real.
            </Text>
          </View>
        </View>
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
