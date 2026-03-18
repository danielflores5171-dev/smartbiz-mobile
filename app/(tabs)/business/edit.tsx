import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

export default function BusinessEdit() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { colors } = useTheme();

  const id = useMemo(() => {
    const raw = params?.id;
    if (!raw) return "";
    return Array.isArray(raw) ? (raw[0] ?? "") : raw;
  }, [params?.id]);

  const businesses = useBusinessStore((s) => s.businesses);

  const biz = useMemo(() => {
    if (!id) return null;
    return businesses.find((b) => b.id === id) ?? null;
  }, [businesses, id]);

  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!biz) return;
    setName(biz.name ?? "");
    setLegalName(biz.legalName ?? "");
    setPhone(biz.phone ?? "");
    setEmail(biz.email ?? "");
    setAddress(biz.address ?? "");
  }, [biz]);

  async function onSave() {
    if (!biz) return;

    await businessActions.updateBusiness(biz.id, {
      name: name.trim(),
      legalName: legalName.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    } as any);

    router.back();
  }

  async function onDelete() {
    if (!biz) return;
    await businessActions.deleteBusiness(biz.id);
    router.back();
  }

  if (!biz) {
    return (
      <Screen padded>
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>
          Negocio no encontrado
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          No existe un negocio con id: {id || "—"}
        </Text>

        <View style={{ marginTop: 14 }}>
          <AppButton
            title="VOLVER"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <View style={{ marginTop: 6, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 22 }}>
          Editar negocio
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Cambia datos del negocio (modo demo).
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
              La edición y baja de negocio, así como la estructura del
              formulario y actualización de datos, ya están alineadas con la
              web; falta autorización Bearer/cookies para persistir cambios
              reales en backend.
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
              El respaldo local de edición y eliminación sigue funcionando en
              modo demo mientras backend no autoriza o no termina de confirmar
              la persistencia remota completa.
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
          <AppButton
            title="GUARDAR CAMBIOS"
            variant="primary"
            onPress={onSave}
          />

          <AppButton
            title="ELIMINAR NEGOCIO"
            variant="secondary"
            onPress={onDelete}
            style={{
              backgroundColor: "rgba(239,68,68,0.18)",
              borderColor: "rgba(239,68,68,0.35)",
            }}
          />

          <AppButton
            title="VOLVER"
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </Screen>
  );
}
