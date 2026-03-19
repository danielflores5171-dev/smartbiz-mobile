// app/(auth)/login.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { apiRequest } from "@/src/lib/apiClient";
import { ENV } from "@/src/lib/env";
import { authActions } from "@/src/store/authStore";
import { useDashboardWidgetsStore } from "@/src/store/dashboardWidgetsStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import AuthFrame from "@/src/ui/AuthFrame";
import ModuleStatusCard from "@/src/ui/ModuleStatusCard";

function isValidEmail(v: string) {
  const x = v.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const emailParam = typeof params.email === "string" ? params.email : "";

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async () => {
    setErrorMsg(null);

    const e = email.trim().toLowerCase();
    const p = pass;

    if (!e || !p) return setErrorMsg("Ingresa tu correo y tu contraseña.");
    if (!isValidEmail(e))
      return setErrorMsg("Escribe un correo válido (ej: correo@ejemplo.com).");
    if (p.length < 6)
      return setErrorMsg("La contraseña debe tener al menos 6 caracteres.");

    try {
      setLoading(true);

      useDashboardWidgetsStore.getState().clearLocalMemoryOnly();

      const session = await authActions.login(e, p);

      const token = session?.token ?? "";
      console.log("TOKEN_HEAD", String(token).slice(0, 10));

      try {
        if (!token) {
          console.log("[bridge] Login OK, pero session.token viene vacío");
        } else {
          const res = await apiRequest<{
            user: { id: string; email: string | null };
          }>("/api/auth/me", { token });

          console.log("[bridge] /api/auth/me OK:", res.data.user);
        }
      } catch (bridgeErr) {
        console.log("[bridge] /api/auth/me FAIL:", String(bridgeErr));
      }

      try {
        const API_BASE_URL = String(ENV.API_BASE_URL ?? "").replace(/\/+$/, "");
        const url = `${API_BASE_URL}/api/auth/me`;

        const res = await fetch(url, {
          method: "GET",
          // @ts-ignore
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const text = await res.text();
        console.log("[bridge-cookie] status:", res.status);
        console.log("[bridge-cookie] body head:", text.slice(0, 120));
      } catch (e) {
        console.log("[bridge-cookie] FAIL:", String(e));
      }

      router.replace("/(tabs)/dashboard" as any);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error al iniciar sesión.");
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
          Iniciar sesión
        </Text>

        <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 18 }}>
          Accede con tu cuenta para continuar.
        </Text>

        <View style={{ marginTop: 12 }}>
          <ModuleStatusCard
            connectedText="Inicio de sesión, obtención de token JWT desde Supabase y validación inicial del usuario contra /api/auth/me ya funcionan con backend real."
            demoText="La sesión por cookies del navegador no aplica igual en React Native; la sincronización completa con algunos módulos todavía depende de cerrar la autorización final por Bearer/token del lado web."
          />
        </View>

        <AppInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />

        <AppInput
          label="Contraseña"
          value={pass}
          onChangeText={setPass}
          placeholder="********"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
        />

        {errorMsg ? (
          <Text style={{ color: colors.dangerText, marginTop: 10 }}>
            {errorMsg}
          </Text>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <AppButton
            title={loading ? "INICIANDO..." : "INICIAR SESIÓN"}
            onPress={onSubmit}
            variant="primary"
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          <Pressable onPress={() => router.push("/(auth)/register" as any)}>
            <Text style={{ color: colors.text }}>
              ¿No tienes una cuenta?{" "}
              <Text style={{ fontWeight: "900", color: "#60a5fa" }}>
                Regístrate
              </Text>
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/forgot-password" as any)}
          >
            <Text style={{ color: colors.text }}>
              ¿Olvidaste tu cuenta?{" "}
              <Text style={{ fontWeight: "900", color: "#60a5fa" }}>
                Recúpérala aquí
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthFrame>
  );
}
