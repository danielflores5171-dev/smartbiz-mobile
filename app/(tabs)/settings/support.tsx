import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/context/theme-context";
import { supportApi } from "@/src/api/supportApi";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import ModuleStatusCard from "@/src/ui/ModuleStatusCard";
import Screen from "@/src/ui/Screen";

export default function SettingsSupportScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const businesses = useBusinessStore((s) => s.businesses);
  const activeBusiness = useMemo(
    () => businesses.find((b) => b.id === activeBusinessId) ?? null,
    [businesses, activeBusinessId],
  );

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = subject.trim().length >= 3 && message.trim().length >= 10;

  async function handleSend() {
    if (!canSend) {
      Alert.alert(
        "Faltan datos",
        "Escribe un asunto y un mensaje más completo.",
      );
      return;
    }

    if (!token) {
      Alert.alert("Sesión inválida", "No se encontró token de sesión.");
      return;
    }

    try {
      setSending(true);

      console.log(
        "[SettingsSupport] send tokenHead=",
        String(token ?? "").slice(0, 10),
        "subject=",
        subject.trim(),
      );

      const out = await supportApi.send(token, {
        subject: subject.trim(),
        message: message.trim(),
        context: {
          module: "settings",
          screen: "support",
          user: {
            id: user?.id ?? null,
            email: user?.email ?? null,
            full_name: user?.fullName ?? null,
          },
          business: {
            id: activeBusiness?.id ?? null,
            name: activeBusiness?.name ?? null,
          },
          app: {
            platform: Platform.OS,
            source: "mobile-app",
          },
          extra: {
            from: "settings/support",
          },
        },
      });

      Alert.alert(
        "Soporte enviado",
        `Tu ticket fue enviado correctamente.${
          out?.ticketId ? `\n\nTicket: ${out.ticketId}` : ""
        }`,
        [{ text: "OK", onPress: () => router.back() }],
      );

      setSubject("");
      setMessage("");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo enviar a soporte.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}
            >
              Soporte
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Envía un ticket al equipo de soporte.
            </Text>
          </View>
        </View>

        <ModuleStatusCard
          connectedText="Envío de tickets, contexto del usuario y del negocio activo, y consumo del endpoint de soporte ya están conectados con web; falta autorización Bearer/cookies estable en todos los entornos."
          demoText="Validación visual local del formulario y parte del flujo de respaldo mientras soporte/backend no autoriza o no responde."
        />

        <View
          style={{
            marginTop: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "900" }}>Asunto</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Ej. No puedo subir imágenes"
            placeholderTextColor={colors.muted}
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card2,
              color: colors.text,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          />

          <Text
            style={{
              color: colors.text,
              fontWeight: "900",
              marginTop: 14,
            }}
          >
            Mensaje
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe el problema, pasos y qué esperabas que pasara."
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            style={{
              marginTop: 8,
              minHeight: 140,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card2,
              color: colors.text,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          />

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              marginVertical: 14,
            }}
          />

          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Usuario:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {user?.email ?? "—"}
            </Text>
          </Text>

          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
            Negocio activo:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {activeBusiness?.name ?? "—"}
            </Text>
          </Text>
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title={sending ? "ENVIANDO..." : "ENVIAR A SOPORTE"}
            onPress={handleSend}
            variant="primary"
            disabled={!canSend || sending}
            loading={sending}
          />
          <AppButton
            title="VOLVER"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
