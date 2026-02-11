import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import type { Employee } from "@/src/types/business";

const ROLES: Employee["role"][] = ["ADMIN", "MANAGER", "CASHIER", "STAFF"];

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.inputBorderEmphasis : colors.border,
        backgroundColor: active ? colors.pillBgActive : colors.pillBg,
      }}
    >
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function EmployeesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const allEmployees = useBusinessStore((s) => s.employees);

  const employees = useMemo(() => {
    if (!activeBusinessId) return [];
    return allEmployees.filter((e) => e.businessId === activeBusinessId);
  }, [allEmployees, activeBusinessId]);

  const [name, setName] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingEmployee = employees.find((e) => e.id === editingId) ?? null;

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<Employee["role"]>("STAFF");
  const [editStatus, setEditStatus] = useState<Employee["status"]>("active");

  useEffect(() => {
    if (!activeBusinessId) return;
    void businessActions.loadEmployees(activeBusinessId);
  }, [activeBusinessId]);

  useEffect(() => {
    if (!editingEmployee) return;
    setEditName(editingEmployee.fullName);
    setEditRole(editingEmployee.role);
    setEditStatus(editingEmployee.status);
  }, [editingEmployee?.id]);

  async function onAdd() {
    if (!activeBusinessId) return;
    const v = name.trim();
    if (!v) return;
    await businessActions.addEmployeeQuick(v);
    setName("");
  }

  async function onSaveEdit() {
    if (!editingEmployee) return;
    const v = editName.trim();
    if (!v) return;

    await businessActions.updateEmployeeLocal(editingEmployee.id, {
      fullName: v,
      role: editRole,
      status: editStatus,
    });

    setEditingId(null);
  }

  function onDeactivate(id: string) {
    Alert.alert(
      "Desactivar empleado",
      "Esto lo marcará como inactive (demo local).",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            await businessActions.updateEmployeeLocal(id, {
              status: "inactive",
            });
            if (editingId === id) setEditingId(null);
          },
        },
      ],
    );
  }

  if (!activeBusinessId) {
    return (
      <Screen center padded>
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 16,
            width: "100%",
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>
            Empleados
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Primero selecciona un negocio.
          </Text>

          <View style={{ marginTop: 14, gap: 10 }}>
            <AppButton
              title="IR A NEGOCIO"
              onPress={() => router.replace("/business" as any)}
              variant="primary"
            />
            <AppButton
              title="VOLVER"
              onPress={() => router.back()}
              variant="secondary"
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text
              style={{ color: colors.text, fontSize: 26, fontWeight: "900" }}
            >
              Empleados
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 18 }}>
              (Demo) Lista local. Luego se conecta a endpoint.
            </Text>
          </View>

          <AppButton
            title="VOLVER"
            onPress={() => router.back()}
            variant="secondary"
            fullWidth={false}
          />
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text
          style={{ color: colors.text, fontWeight: "900", marginBottom: 8 }}
        >
          Agregar empleado
        </Text>

        <AppInput
          label="Nombre del empleado"
          value={name}
          onChangeText={setName}
          placeholder="Nombre completo"
          autoCapitalize="words"
        />

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton title="AGREGAR" onPress={onAdd} variant="primary" />
          <AppButton
            title="REFRESCAR"
            onPress={() =>
              void businessActions.refreshEmployees(activeBusinessId)
            }
            variant="secondary"
          />
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        {editingEmployee ? (
          <View
            style={{
              backgroundColor: colors.card2,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}
            >
              Editar empleado
            </Text>

            <AppInput
              label="Nombre"
              value={editName}
              onChangeText={setEditName}
              placeholder="Nombre completo"
              autoCapitalize="words"
            />

            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>
              Rol
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              {ROLES.map((r) => (
                <Pill
                  key={r}
                  label={r}
                  active={editRole === r}
                  onPress={() => setEditRole(r)}
                />
              ))}
            </View>

            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>
              Estado
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Pill
                label="active"
                active={editStatus === "active"}
                onPress={() => setEditStatus("active")}
              />
              <Pill
                label="inactive"
                active={editStatus === "inactive"}
                onPress={() => setEditStatus("inactive")}
              />
            </View>

            <View style={{ marginTop: 14, gap: 10 }}>
              <AppButton
                title="GUARDAR"
                onPress={onSaveEdit}
                variant="primary"
              />
              <AppButton
                title="CANCELAR EDICIÓN"
                onPress={() => setEditingId(null)}
                variant="secondary"
              />
            </View>
          </View>
        ) : null}

        <Text
          style={{ color: colors.text, fontWeight: "900", marginBottom: 8 }}
        >
          Lista
        </Text>

        {employees.map((e) => (
          <View
            key={e.id}
            style={{
              backgroundColor: colors.card2,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 15 }}
            >
              {e.fullName}
            </Text>

            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Rol:{" "}
              <Text style={{ color: colors.accent, fontWeight: "900" }}>
                {e.role}
              </Text>
              {" · "}Estado:{" "}
              <Text style={{ color: colors.text, fontWeight: "900" }}>
                {e.status}
              </Text>
            </Text>

            <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="EDITAR"
                  onPress={() => setEditingId(e.id)}
                  variant="secondary"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="DESACTIVAR"
                  onPress={() => onDeactivate(e.id)}
                  variant="secondary"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.18)",
                    borderColor: "rgba(239,68,68,0.35)",
                  }}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}
