// app/(auth)/confirmation-token.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { authActions, useAuthStore } from "@/src/store/authStore";
import AuthFrame from "@/src/ui/AuthFrame";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim().toLowerCase());
}

export default function ConfirmationTokenScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const emailParam = typeof params.email === "string" ? params.email : "";
  const devCode = useAuthStore((s) => s.resetDevCode);

  const [code, setCode] = useState("");
  const [email, setEmail] = useState(emailParam);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => code.trim().length >= 4, [code]);

  const onConfirm = async () => {
    setErrorMsg(null);

    const e = email.trim();
    const c = code.trim();

    if (!e) return setErrorMsg("Escribe tu correo.");
    if (!isValidEmail(e)) return setErrorMsg("Escribe un correo válido.");
    if (c.length < 4) return setErrorMsg("Escribe un código válido.");

    try {
      setLoading(true);
      await authActions.verifyResetCode(e, c);

      Alert.alert("Código verificado", "Ahora puedes cambiar tu contraseña.");

      router.push({
        pathname: "/(auth)/reset-password" as any,
        params: { email: e, code: c },
      } as any);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "No se pudo verificar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame center>
      <View
        style={{
          width: "100%",
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          padding: 18,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
          Verifica tu correo
        </Text>

        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 20 }}>
          Ingresa el código que recibiste. (Modo demo)
        </Text>

        {/* ✅ MOSTRAR SIEMPRE el código demo si existe */}
        {devCode ? (
          <Text style={{ color: colors.muted, marginTop: 8, fontSize: 12 }}>
            Código demo: <Text style={{ fontWeight: "900" }}>{devCode}</Text>
          </Text>
        ) : null}

        <Text style={{ color: colors.muted, marginTop: 14, fontSize: 12 }}>
          Correo
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            marginTop: 8,
            backgroundColor: colors.card2,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        />

        <Text style={{ color: colors.muted, marginTop: 12, fontSize: 12 }}>
          Código
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          style={{
            marginTop: 8,
            backgroundColor: colors.card2,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            letterSpacing: 3,
            fontWeight: "800",
          }}
        />

        {errorMsg ? (
          <Text style={{ color: "rgba(248,113,113,0.95)", marginTop: 10 }}>
            {errorMsg}
          </Text>
        ) : null}

        <Pressable
          onPress={() => {
            if (!canSubmit || loading) return;
            void onConfirm();
          }}
          style={{
            marginTop: 16,
            backgroundColor: colors.accent,
            opacity: canSubmit && !loading ? 1 : 0.5,
            borderRadius: 14,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            {loading ? "CONFIRMANDO..." : "CONFIRMAR"}
          </Text>
        </Pressable>

        <View style={{ marginTop: 14, alignItems: "center", gap: 10 }}>
          <Pressable onPress={() => router.push("/(auth)/resend-code" as any)}>
            <Text style={{ color: colors.text }}>
              ¿No recibiste el código?{" "}
              <Text style={{ fontWeight: "900" }}>Reenviar</Text>
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colors.text }}>
              Volver <Text style={{ fontWeight: "900" }}>atrás</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthFrame>
  );
}
