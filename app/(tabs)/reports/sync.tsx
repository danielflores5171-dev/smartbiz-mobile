import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";

type SyncEntity =
  | "inventory"
  | "sales"
  | "profile"
  | "notifications"
  | "reports";

type SyncItem = {
  id: string;
  entity: SyncEntity;
  action: "create" | "update" | "delete";
  createdAt: string;
  businessId?: string;
  detail?: string;
};

type SyncState = {
  hydrated: boolean;
  lastSyncAt: string | null;
  lastSyncOk: boolean;
  lastError: string | null;
  queue: SyncItem[];
  syncing: boolean;
  online: boolean;
};

const STORAGE_KEY = "smartbiz.syncStore.v1";

function nowISO() {
  return new Date().toISOString();
}

function makeId(prefix = "sync") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`;
}

async function loadPersisted(): Promise<Partial<SyncState> | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<SyncState>;
  } catch {
    return null;
  }
}

async function savePersisted(state: SyncState) {
  const payload = {
    lastSyncAt: state.lastSyncAt,
    lastSyncOk: state.lastSyncOk,
    lastError: state.lastError,
    queue: state.queue,
    online: state.online,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

async function syncService_getStatus(activeBusinessId?: string | null) {
  await new Promise((r) => setTimeout(r, 300));
  return {
    serverTime: nowISO(),
    businessId: activeBusinessId ?? null,
    ok: true,
  };
}

async function syncService_postSync(params: {
  businessId?: string | null;
  items: SyncItem[];
  online: boolean;
}) {
  await new Promise((r) => setTimeout(r, 900));

  if (!params.online) throw new Error("Sin conexión. No se pudo sincronizar.");

  const dice = Math.random();
  if (dice < 0.08)
    throw new Error("Error temporal del servidor (demo). Intenta de nuevo.");

  return {
    syncedCount: params.items.length,
    serverReceiptId: makeId("srv"),
    finishedAt: nowISO(),
  };
}

export default function ReportsSync() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const [state, setState] = useState<SyncState>({
    hydrated: false,
    lastSyncAt: null,
    lastSyncOk: true,
    lastError: null,
    queue: [],
    syncing: false,
    online: true,
  });

  useEffect(() => {
    (async () => {
      const persisted = await loadPersisted();
      setState((s) => ({
        ...s,
        hydrated: true,
        lastSyncAt: persisted?.lastSyncAt ?? null,
        lastSyncOk: persisted?.lastSyncOk ?? true,
        lastError: persisted?.lastError ?? null,
        queue: persisted?.queue ?? [],
        online: persisted?.online ?? true,
      }));
    })();
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    void savePersisted(state);
  }, [
    state.hydrated,
    state.lastSyncAt,
    state.lastSyncOk,
    state.lastError,
    state.queue,
    state.online,
  ]);

  const pendingCount = state.queue.length;

  const byEntity = useMemo(() => {
    const map: Record<SyncEntity, number> = {
      inventory: 0,
      sales: 0,
      profile: 0,
      notifications: 0,
      reports: 0,
    };
    for (const it of state.queue) map[it.entity] = (map[it.entity] ?? 0) + 1;
    return map;
  }, [state.queue]);

  const addPending = (
    entity: SyncEntity,
    action: SyncItem["action"],
    detail?: string,
  ) => {
    const item: SyncItem = {
      id: makeId("q"),
      entity,
      action,
      createdAt: nowISO(),
      businessId: activeBusinessId ?? undefined,
      detail,
    };
    setState((s) => ({ ...s, queue: [item, ...s.queue], lastError: null }));
  };

  const clearQueue = () =>
    setState((s) => ({ ...s, queue: [], lastError: null }));
  const toggleOnline = () => setState((s) => ({ ...s, online: !s.online }));

  const refreshStatus = async () => {
    try {
      setState((s) => ({ ...s, lastError: null }));
      await syncService_getStatus(activeBusinessId);
      Alert.alert("Estado actualizado", "Estado refrescado (demo).");
    } catch (e: any) {
      setState((s) => ({ ...s, lastError: e?.message ?? "Error" }));
      Alert.alert("Error", e?.message ?? "No se pudo refrescar el estado");
    }
  };

  const runSync = async () => {
    if (state.syncing) return;

    if (!activeBusinessId) {
      Alert.alert("Sin negocio", "Primero selecciona un negocio.");
      return;
    }

    if (state.queue.length === 0) {
      setState((s) => ({ ...s, syncing: true, lastError: null }));
      try {
        await syncService_getStatus(activeBusinessId);
        const finishedAt = nowISO();
        setState((s) => ({
          ...s,
          syncing: false,
          lastSyncAt: finishedAt,
          lastSyncOk: true,
          lastError: null,
        }));
        Alert.alert(
          "Sin pendientes",
          "No hay cambios por sincronizar.\n\nSe verificó el estado (demo). ✅",
        );
      } catch (e: any) {
        setState((s) => ({
          ...s,
          syncing: false,
          lastSyncOk: false,
          lastError: e?.message ?? "Error",
        }));
        Alert.alert("Error", e?.message ?? "No se pudo verificar el estado");
      }
      return;
    }

    setState((s) => ({ ...s, syncing: true, lastError: null }));

    try {
      const res = await syncService_postSync({
        businessId: activeBusinessId,
        items: state.queue,
        online: state.online,
      });

      setState((s) => ({
        ...s,
        syncing: false,
        queue: [],
        lastSyncAt: res.finishedAt,
        lastSyncOk: true,
        lastError: null,
      }));

      Alert.alert(
        "Sincronización completa",
        `Listo ✅\n\nEnviados: ${res.syncedCount}\nRecibo: ${res.serverReceiptId}`,
      );
    } catch (e: any) {
      setState((s) => ({
        ...s,
        syncing: false,
        lastSyncOk: false,
        lastError: e?.message ?? "Error",
      }));
      Alert.alert("No se pudo sincronizar", e?.message ?? "Error");
    }
  };

  const MiniBtn = ({
    title,
    onPress,
    danger,
    flex,
  }: {
    title: string;
    onPress: () => void;
    danger?: boolean;
    flex?: number;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: flex ?? undefined,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: danger ? colors.dangerBorder : colors.border,
        backgroundColor: danger ? colors.dangerBg : colors.card2,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}>
        {title}
      </Text>
    </Pressable>
  );

  if (!activeBusinessId) {
    return (
      <Screen center padded>
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Primero selecciona un negocio.
        </Text>
        <View style={{ marginTop: 12 }}>
          <AppButton
            title="IR A NEGOCIO"
            onPress={() => router.replace("/(tabs)/business" as any)}
            variant="primary"
          />
          <View style={{ marginTop: 10 }}>
            <AppButton
              title="VOLVER A REPORTES"
              onPress={() => router.replace("/(tabs)/reports" as any)}
              variant="secondary"
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.replace("/(tabs)/reports" as any)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card2,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900" }}>
            Sincronización
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Cola offline + status (demo). Luego se conecta a endpoints reales.
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 14,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: state.online
                ? colors.successBg
                : colors.dangerBg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons
              name={state.online ? "wifi-outline" : "cloud-offline-outline"}
              size={18}
              color={state.online ? colors.successText : colors.dangerText}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}
            >
              {activeBiz?.name ?? "Negocio"}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
              Estado:{" "}
              <Text style={{ color: colors.text, fontWeight: "900" }}>
                {state.online ? "Online" : "Offline"}
              </Text>
              {" · "}
              Pendientes:{" "}
              <Text style={{ color: colors.text, fontWeight: "900" }}>
                {pendingCount}
              </Text>
            </Text>
          </View>

          <Pressable
            onPress={toggleOnline}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card2,
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}
            >
              {state.online ? "SIMULAR OFFLINE" : "SIMULAR ONLINE"}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <Text style={{ color: colors.muted }}>
          Último sync:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {state.lastSyncAt
              ? new Date(state.lastSyncAt).toLocaleString()
              : "—"}
          </Text>
        </Text>

        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Resultado:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {state.lastSyncAt ? (state.lastSyncOk ? "OK" : "Con errores") : "—"}
          </Text>
        </Text>

        {state.lastError ? (
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: colors.dangerText, fontWeight: "900" }}>
              {state.lastError}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton
            title={
              state.syncing
                ? "SINCRONIZANDO..."
                : pendingCount === 0
                  ? "SINCRONIZAR AHORA (CHECK)"
                  : "SINCRONIZAR AHORA"
            }
            onPress={runSync}
            variant="primary"
            disabled={state.syncing}
          />

          <AppButton
            title="REFRESCAR ESTADO"
            onPress={refreshStatus}
            variant="secondary"
          />
        </View>
      </View>

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
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          Pendientes por módulo
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Simulación: cambios locales que se subirían al backend.
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        {(
          [
            ["inventory", "Inventario", "cube-outline"],
            ["sales", "Ventas", "cart-outline"],
            ["profile", "Perfil", "person-outline"],
            ["notifications", "Notificaciones", "notifications-outline"],
            ["reports", "Reportes", "analytics-outline"],
          ] as const
        ).map(([key, label, icon]) => (
          <View
            key={key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 10,
            }}
          >
            <Ionicons name={icon as any} size={18} color={colors.muted} />
            <Text style={{ color: colors.text, fontWeight: "900", flex: 1 }}>
              {label}
            </Text>
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {byEntity[key as SyncEntity] ?? 0}
            </Text>
          </View>
        ))}

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <MiniBtn
            title="LIMPIAR COLA"
            danger
            flex={1}
            onPress={() =>
              Alert.alert("Limpiar", "¿Borrar pendientes?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Borrar", style: "destructive", onPress: clearQueue },
              ])
            }
          />
          <MiniBtn
            title="VOLVER A REPORTES"
            flex={1}
            onPress={() => router.replace("/(tabs)/reports" as any)}
          />
        </View>
      </View>

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
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          Simulador de cambios (demo)
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Genera pendientes para probar la cola y el botón “Sincronizar”.
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {(
            [
              [
                "inventory",
                "Inventario",
                "cube-outline",
                "update",
                "Ajuste de stock",
              ],
              ["sales", "Venta", "cart-outline", "create", "Nueva venta"],
              [
                "profile",
                "Perfil",
                "person-outline",
                "update",
                "Cambio de perfil",
              ],
              [
                "notifications",
                "Notifs",
                "notifications-outline",
                "update",
                "Marcar como leído",
              ],
              [
                "reports",
                "Reportes",
                "analytics-outline",
                "update",
                "Export pendiente",
              ],
            ] as const
          ).map(([entity, label, icon, action, detail]) => (
            <Pressable
              key={entity}
              onPress={() =>
                addPending(entity as SyncEntity, action as any, detail)
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.accentSoft,
              }}
            >
              <Ionicons name={icon as any} size={16} color="#93c5fd" />
              <Text
                style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Tip: pon “SIMULAR OFFLINE”, genera pendientes y verás que Sync
            falla. Luego vuelve a Online y sincroniza.
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Últimos pendientes
        </Text>

        <View style={{ marginTop: 10, gap: 10 }}>
          {state.queue.length === 0 ? (
            <Text style={{ color: colors.muted }}>(Sin pendientes)</Text>
          ) : (
            state.queue.slice(0, 6).map((q) => (
              <View
                key={q.id}
                style={{
                  backgroundColor: colors.card2,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "900" }}>
                  {q.entity.toUpperCase()} · {q.action.toUpperCase()}
                </Text>
                <Text
                  style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}
                >
                  {new Date(q.createdAt).toLocaleString()}
                  {q.detail ? ` · ${q.detail}` : ""}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
