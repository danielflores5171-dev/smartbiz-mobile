// app/(auth)/login.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { authActions } from "@/src/store/authStore";
import { useDashboardWidgetsStore } from "@/src/store/dashboardWidgetsStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import AuthFrame from "@/src/ui/AuthFrame";

// ✅ API client (puente móvil → web)
import { apiRequest } from "@/src/lib/apiClient";

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

      // ✅ Limpia widgets (por si venías de otro usuario / demo)
      useDashboardWidgetsStore.getState().clearLocalMemoryOnly();

      // 1) Login (tu authService devuelve session.token)
      const session = await authActions.login(e, p);

      // ✅ DIAGNÓSTICO: ver si el token es JWT real (debe empezar con "eyJ")
      const token = session?.token ?? "";
      console.log("TOKEN_HEAD", String(token).slice(0, 10));

      // 2) ✅ Puente móvil → web: token → /api/auth/me
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

      // 3) Navega normal
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
