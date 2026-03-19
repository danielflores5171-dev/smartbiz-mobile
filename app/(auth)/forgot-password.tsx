// app/(auth)/forgot-password.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { authActions } from "@/src/store/authStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import AuthFrame from "@/src/ui/AuthFrame";
import ModuleStatusCard from "@/src/ui/ModuleStatusCard";

function isValidEmail(v: string) {
  const x = v.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const onSubmit = async () => {
    setErrorMsg(null);
    setOkMsg(null);

    const e = email.trim();

    if (!e) return setErrorMsg("Escribe tu correo.");
    if (!isValidEmail(e))
      return setErrorMsg("Escribe un correo válido (ej: correo@ejemplo.com).");

    try {
      setLoading(true);

      const out = await authActions.requestPasswordReset(e);

      setOkMsg(
        "Se envió la solicitud de recuperación. Revisa tu correo y, si lo necesitas, también puedes continuar con el flujo demo interno.",
      );

      Alert.alert(
        "Recuperación iniciada",
        out?.devCode
          ? `Se envió el correo real de recuperación. Como apoyo interno, también se generó un código demo: ${out.devCode}`
          : "Se envió el correo real de recuperación. Revisa tu bandeja de entrada o spam.",
        [
          {
            text: "Continuar",
            onPress: () =>
              router.push({
                pathname: "/(auth)/confirmation-token" as any,
                params: { email: e },
              } as any),
          },
        ],
      );
    } catch (err: any) {
      setErrorMsg(err?.message ?? "No se pudo procesar la solicitud.");
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
          Restablecer contraseña
        </Text>

        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 18 }}>
          Escribe tu correo para iniciar la recuperación de tu cuenta.
        </Text>

        <View style={{ marginTop: 12 }}>
          <ModuleStatusCard
            connectedText="La solicitud de recuperación ya se envía con backend real mediante Supabase y dispara el correo de restablecimiento."
            demoText="La verificación por código y el recorrido interno dentro de la app se mantienen como apoyo visual/demo; el cambio real de contraseña depende del enlace enviado por correo."
          />
        </View>

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

        {okMsg ? (
          <Text style={{ color: colors.successText, marginTop: 10 }}>
            {okMsg}
          </Text>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <AppButton
            title={loading ? "ENVIANDO..." : "ENVIAR RECUPERACIÓN"}
            onPress={onSubmit}
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
