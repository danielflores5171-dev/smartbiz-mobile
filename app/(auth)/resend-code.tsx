// app/(auth)/resend-code.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { authActions } from "@/src/store/authStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import AuthFrame from "@/src/ui/AuthFrame";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim().toLowerCase());
}

export default function ResendCodeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onResend = async () => {
    setErrorMsg(null);
    const e = email.trim();

    if (!e) return setErrorMsg("Escribe tu correo.");
    if (!isValidEmail(e)) return setErrorMsg("Escribe un correo válido.");

    try {
      setLoading(true);
      const out = await authActions.resendPasswordReset(e);

      const goNext = () =>
        router.push({
          pathname: "/(auth)/confirmation-token" as any,
          params: { email: e },
        } as any);

      if (out?.devCode) {
        Alert.alert("Código demo (reenviado)", `Tu código es: ${out.devCode}`, [
          { text: "OK", onPress: goNext },
        ]);
      } else {
        Alert.alert(
          "Aviso",
          "No llegó devCode. Revisa authService y reinicia con -c.",
          [{ text: "OK", onPress: goNext }],
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "No se pudo reenviar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame center>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          padding: 18,
          width: "100%",
          maxWidth: 520,
          alignSelf: "center",
        }}
      >
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
          Reenviar código
        </Text>
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Si no te llegó el código, vuelve a solicitarlo (demo).
        </Text>

        <AppInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {errorMsg ? (
          <Text style={{ color: colors.dangerText, marginTop: 10 }}>
            {errorMsg}
          </Text>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <AppButton
            title={loading ? "REENVIANDO..." : "REENVIAR"}
            onPress={onResend}
            variant="primary"
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <AppButton title="VOLVER" variant="secondary" onPress={router.back} />
        </View>
      </View>
    </AuthFrame>
  );
}
