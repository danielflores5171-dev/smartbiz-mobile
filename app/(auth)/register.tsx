// app/(auth)/register.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { authActions } from "@/src/store/authStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import AuthCard from "@/src/ui/AuthCard";
import AuthFrame from "@/src/ui/AuthFrame";

function isValidEmail(v: string) {
  const x = v.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [name, setName] = useState("");
  const [last, setLast] = useState("");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [dob, setDob] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fullName = useMemo(() => {
    const n = name.trim();
    const l = last.trim();
    const out = `${n} ${l}`.trim();
    return out || undefined;
  }, [name, last]);

  const onSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const e = email.trim();
    const p = pass;

    if (!name.trim() || !last.trim())
      return setErrorMsg("Escribe tu nombre y apellidos.");
    if (!user.trim()) return setErrorMsg("Escribe un nombre de usuario.");
    if (!e || !p) return setErrorMsg("Completa correo y contraseña.");
    if (!isValidEmail(e))
      return setErrorMsg("Escribe un correo válido (ej: correo@ejemplo.com).");
    if (p.length < 6)
      return setErrorMsg("La contraseña debe tener al menos 6 caracteres.");

    try {
      setLoading(true);

      await authActions.register(e, p, fullName);
      await authActions.logout();

      setSuccessMsg("✅ Cuenta creada. Ahora inicia sesión con tus datos.");

      setTimeout(() => {
        router.replace({
          pathname: "/(auth)/login",
          params: { email: e },
        } as any);
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "No se pudo registrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame scroll center>
      <AuthCard>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
          Crear cuenta
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Crea tu cuenta para empezar
        </Text>

        <AppInput
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          autoCapitalize="words"
        />
        <AppInput
          label="Apellidos"
          value={last}
          onChangeText={setLast}
          placeholder="Tus apellidos"
          autoCapitalize="words"
        />
        <AppInput
          label="Nombre de usuario"
          value={user}
          onChangeText={setUser}
          placeholder="tu_usuario"
          autoCapitalize="none"
        />

        <Text style={{ color: colors.muted, marginTop: 8, fontSize: 11 }}>
          Se guardará como:{" "}
          <Text style={{ fontWeight: "900", color: "#93c5fd" }}>
            {user || "tu_usuario"}
          </Text>
        </Text>

        <AppInput
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label="Contraseña"
          value={pass}
          onChangeText={setPass}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
        />
        <AppInput
          label="Fecha de nacimiento"
          value={dob}
          onChangeText={setDob}
          placeholder="dd/mm/aaaa"
          keyboardType="default"
        />

        {errorMsg ? (
          <Text style={{ color: colors.dangerText, marginTop: 10 }}>
            {errorMsg}
          </Text>
        ) : null}

        {successMsg ? (
          <Text style={{ color: colors.successText, marginTop: 10 }}>
            {successMsg}
          </Text>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <AppButton
            title={loading ? "CREANDO..." : "REGISTRARSE"}
            onPress={onSubmit}
            variant="primary"
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={{ marginTop: 14, alignItems: "center", gap: 10 }}>
          <Pressable onPress={() => router.push("/(auth)/login" as any)}>
            <Text style={{ color: colors.text }}>
              ¿Ya tienes cuenta?{" "}
              <Text style={{ fontWeight: "900", color: "#93c5fd" }}>
                Inicia sesión
              </Text>
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/forgot-password" as any)}
          >
            <Text style={{ color: colors.text }}>
              ¿Olvidaste tu cuenta?{" "}
              <Text style={{ fontWeight: "900", color: "#93c5fd" }}>
                Recupérala aquí
              </Text>
            </Text>
          </Pressable>
        </View>
      </AuthCard>
    </AuthFrame>
  );
}
