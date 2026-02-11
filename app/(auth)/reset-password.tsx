// app/(auth)/reset-password.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { authActions } from "@/src/store/authStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import AuthFrame from "@/src/ui/AuthFrame";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const email = typeof params.email === "string" ? params.email : "";
  const code = typeof params.code === "string" ? params.code : "";

  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return pass.length >= 6 && pass === pass2;
  }, [pass, pass2]);

  const onSubmit = async () => {
    setErrorMsg(null);

    if (!email || !code) {
      setErrorMsg("Falta el correo o el código. Vuelve a confirmar.");
      return;
    }
    if (pass.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pass !== pass2) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      await authActions.resetPassword(email, code, pass);
      Alert.alert("Listo", "Contraseña actualizada (demo).");
      router.replace("/(auth)/login" as any);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "No se pudo actualizar la contraseña.");
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
          Nueva contraseña
        </Text>
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Crea una nueva contraseña para tu cuenta.
        </Text>

        <AppInput
          label="Nueva contraseña"
          value={pass}
          onChangeText={setPass}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
        />
        <AppInput
          label="Confirmar contraseña"
          value={pass2}
          onChangeText={setPass2}
          placeholder="Repite la contraseña"
          secureTextEntry
        />

        {errorMsg ? (
          <Text style={{ color: colors.dangerText, marginTop: 10 }}>
            {errorMsg}
          </Text>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <AppButton
            title={loading ? "GUARDANDO..." : "GUARDAR"}
            onPress={onSubmit}
            variant="primary"
            loading={loading}
            disabled={!canSubmit || loading}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <AppButton title="VOLVER" variant="secondary" onPress={router.back} />
        </View>
      </View>
    </AuthFrame>
  );
}
