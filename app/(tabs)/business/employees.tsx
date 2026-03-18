import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { useAuthStore } from "@/src/store/authStore";
import { businessActions, useBusinessStore } from "@/src/store/businessStore";
import type { Employee, EmployeeRole } from "@/src/types/business";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

const ROLES: EmployeeRole[] = ["ADMIN", "MANAGER", "CASHIER", "STAFF"];

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

  const token = useAuthStore((s) => s.token);
  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const allEmployees = useBusinessStore((s) => s.employees);

  const employees = useMemo(() => {
    if (!activeBusinessId) return [];
    return allEmployees.filter((e) => e.businessId === activeBusinessId);
  }, [allEmployees, activeBusinessId]);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EmployeeRole>("STAFF");

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingEmployee = useMemo(
    () => employees.find((e) => e.id === editingId) ?? null,
    [employees, editingId],
  );

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<Employee["role"]>("STAFF");
  const [editStatus, setEditStatus] = useState<Employee["status"]>("active");

  useEffect(() => {
    if (!activeBusinessId) {
      console.log("[EmployeesScreen] no active business");
      return;
    }

    console.log(
      "[EmployeesScreen] load start businessId=",
      activeBusinessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    void businessActions.loadEmployees(activeBusinessId, token ?? undefined);
  }, [activeBusinessId, token]);

  useEffect(() => {
    if (!editingEmployee) return;

    setEditName(editingEmployee.fullName ?? "");
    setEditRole(editingEmployee.role);
    setEditStatus(editingEmployee.status);
  }, [editingEmployee]);

  async function onAdd() {
    if (!activeBusinessId) return;

    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail) {
      Alert.alert("Falta el correo", "Ingresa el correo del empleado.");
      return;
    }

    console.log(
      "[EmployeesScreen] add employee email=",
      safeEmail,
      "role=",
      role,
      "businessId=",
      activeBusinessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    try {
      await businessActions.addEmployee(
        {
          email: safeEmail,
          role,
        },
        token ?? undefined,
      );

      console.log("[EmployeesScreen] add employee OK");

      setEmail("");
      setRole("STAFF");
    } catch (e: any) {
      console.log("[EmployeesScreen] add employee FAIL:", String(e));
      Alert.alert("No se pudo agregar", e?.message ?? "Error desconocido");
    }
  }

  async function onSaveEdit() {
    if (!editingEmployee) return;

    const v = editName.trim();
    if (!v) {
      Alert.alert("Falta el nombre", "Ingresa un nombre válido.");
      return;
    }

    console.log(
      "[EmployeesScreen] save local edit employeeId=",
      editingEmployee.id,
      "role=",
      editRole,
      "status=",
      editStatus,
    );

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
      "Esto lo marcará como inactive solo en la app por ahora.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            console.log("[EmployeesScreen] deactivate local employeeId=", id);

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
              Alta real por backend con correo y rol. Edición avanzada sigue
              local por ahora.
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
            backgroundColor: colors.card2,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            padding: 14,
            marginTop: 14,
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
              <Text
                style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}
              >
                El alta de empleados por correo y rol, el refresco del listado y
                la carga inicial ya coinciden con la web; falta autorización
                Bearer/cookies para operar completamente contra backend real.
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
              <Text
                style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}
              >
                La edición avanzada de nombre, cambio de estado y desactivación
                siguen como respaldo local/demo y se completarán en futuras
                actualizaciones con persistencia remota real.
              </Text>
            </View>
          </View>
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
          label="Correo del empleado"
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
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
              active={role === r}
              onPress={() => setRole(r)}
            />
          ))}
        </View>

        <Text style={{ color: colors.muted, marginTop: 10, fontSize: 12 }}>
          STAFF se manda al backend como VIEWER.
        </Text>

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton title="AGREGAR" onPress={onAdd} variant="primary" />
          <AppButton
            title="REFRESCAR"
            onPress={() => {
              console.log(
                "[EmployeesScreen] refresh businessId=",
                activeBusinessId,
                "tokenHead=",
                String(token ?? "").slice(0, 10),
              );
              void businessActions.refreshEmployees(
                activeBusinessId,
                token ?? undefined,
              );
            }}
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
              {e.email ?? "Sin correo"}
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
