// app/(tabs)/reports/inventory.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import {
  inventoryActions,
  useInventoryStore,
} from "@/src/store/inventoryStore";
import AppButton from "@/src/ui/AppButton";
import ModuleStatusCard from "@/src/ui/ModuleStatusCard";
import Screen from "@/src/ui/Screen";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

type Days = 7 | 30 | 90;

function safeTime(v: unknown) {
  const t = new Date(String(v ?? "")).getTime();
  return Number.isFinite(t) ? t : 0;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 14,
        minHeight: 92,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name={icon} size={18} color="#93c5fd" />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}
          >
            {title}
          </Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
            {value}
          </Text>
          {subtitle ? (
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function ReportsInventory() {
  const router = useRouter();
  const { colors } = useTheme();

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const token = useAuthStore((s) => s.token);

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const allProducts = useInventoryStore((s) => s.products ?? []);
  const allAdjustments = useInventoryStore((s) => s.adjustments ?? []);
  const loading = useInventoryStore((s) => s.loading);

  const [days, setDays] = useState<Days>(30);

  useEffect(() => {
    if (!userId) return;
    void inventoryActions.bootstrap(userId);
    if (activeBusinessId) {
      void inventoryActions.loadProducts(activeBusinessId, token);
    }
  }, [userId, activeBusinessId, token]);

  const cutoff = useMemo(() => Date.now() - days * 24 * 60 * 60 * 1000, [days]);

  const products = useMemo(() => {
    if (!activeBusinessId) return [];
    return allProducts.filter((p: any) => p.businessId === activeBusinessId);
  }, [allProducts, activeBusinessId]);

  const adjustmentsInPeriod = useMemo(() => {
    if (!activeBusinessId) return [];
    return allAdjustments
      .filter((a: any) => a.businessId === activeBusinessId)
      .filter((a: any) => safeTime(a.createdAt) >= cutoff)
      .slice()
      .sort((a: any, b: any) => safeTime(b.createdAt) - safeTime(a.createdAt));
  }, [allAdjustments, activeBusinessId, cutoff]);

  const lowStock = useMemo(() => {
    return products.filter(
      (p: any) => p.minStock != null && p.stock <= p.minStock,
    );
  }, [products]);

  const lastMoveByProduct = useMemo(() => {
    const map = new Map<string, string>();
    if (!activeBusinessId) return map;

    const relevant = allAdjustments
      .filter((a: any) => a.businessId === activeBusinessId)
      .slice()
      .sort((a: any, b: any) => safeTime(b.createdAt) - safeTime(a.createdAt));

    for (const a of relevant) {
      if (!map.has(String(a.productId))) {
        map.set(String(a.productId), String(a.createdAt));
      }
    }
    return map;
  }, [allAdjustments, activeBusinessId]);

  const noMovement = useMemo(() => {
    const ms = days * 24 * 60 * 60 * 1000;
    const now = Date.now();

    return products
      .filter((p: any) => {
        const last = lastMoveByProduct.get(String(p.id));
        if (!last) return true;
        const dt = safeTime(last);
        return now - dt > ms;
      })
      .slice(0, 30);
  }, [products, lastMoveByProduct, days]);

  const stockValue = useMemo(() => {
    return round2(
      products.reduce(
        (acc: number, p: any) => acc + p.stock * (p.cost ?? 0),
        0,
      ),
    );
  }, [products]);

  const Pill = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: active ? colors.pillBgActive : colors.pillBg,
      }}
    >
      <Ionicons
        name="calendar-outline"
        size={16}
        color={active ? "#93c5fd" : colors.muted}
      />
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}>
        {label}
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
            title="VOLVER A REPORTES"
            onPress={() => router.replace("/(tabs)/reports" as any)}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
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
            backgroundColor: colors.card2,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900" }}>
            Reporte de inventario
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Bajo stock, sin movimiento y movimientos recientes (demo) —{" "}
            {activeBiz?.name ?? "Negocio"}.
          </Text>
        </View>
      </View>

      <ModuleStatusCard
        connectedText="Consulta de productos, movimientos y estructura del reporte de inventario ya coinciden con web; falta autorización Bearer/cookies y cierre de algunos ajustes backend."
        demoText="Cálculo de bajo stock, sin movimiento, valor de inventario y movimientos del periodo sigue funcionando en local/demo y se ampliará en próximas actualizaciones."
      />

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 14,
        }}
      >
        <Pill
          label="Últimos 7 días"
          active={days === 7}
          onPress={() => setDays(7)}
        />
        <Pill
          label="Últimos 30 días"
          active={days === 30}
          onPress={() => setDays(30)}
        />
        <Pill
          label="Últimos 90 días"
          active={days === 90}
          onPress={() => setDays(90)}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <StatCard
          title="Productos"
          value={String(products.length)}
          subtitle={loading ? "Cargando..." : "En inventario"}
          icon="cube-outline"
          onPress={() => router.push("/(tabs)/inventory" as any)}
        />
        <StatCard
          title="Bajo stock"
          value={String(lowStock.length)}
          subtitle="Revisar mínimo"
          icon="warning-outline"
          onPress={() => router.push("/(tabs)/inventory" as any)}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <StatCard
          title="Sin movimiento"
          value={String(noMovement.length)}
          subtitle={`>${days} días`}
          icon="time-outline"
        />
        <StatCard
          title="Valor inventario"
          value={`$${stockValue.toFixed(2)}`}
          subtitle="Stock × costo"
          icon="cash-outline"
        />
      </View>

      <View
        style={{
          marginTop: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
          Alertas de bajo stock
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Productos con stock menor o igual al mínimo.
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        {lowStock.length === 0 ? (
          <Text style={{ color: colors.muted }}>(Sin alertas)</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {lowStock.slice(0, 20).map((p: any) => (
              <View
                key={String(p.id)}
                style={{
                  backgroundColor: colors.card2,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "900" }}>
                  {p.name}{" "}
                  <Text style={{ color: colors.accent, fontWeight: "900" }}>
                    · {String(p.unit ?? "").toUpperCase()}
                  </Text>
                </Text>
                <Text
                  style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}
                >
                  Stock:{" "}
                  <Text style={{ color: colors.text, fontWeight: "900" }}>
                    {p.stock}
                  </Text>
                  {" · "}Mínimo:{" "}
                  <Text style={{ color: colors.text, fontWeight: "900" }}>
                    {p.minStock ?? 0}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 14 }}>
          <AppButton
            title="IR A INVENTARIO"
            onPress={() => router.push("/(tabs)/inventory" as any)}
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
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
          Productos sin movimiento
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Productos sin ajustes registrados en los últimos {days} días.
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        {noMovement.length === 0 ? (
          <Text style={{ color: colors.muted }}>
            (Sin productos sin movimiento)
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {noMovement.map((p: any) => {
              const last = lastMoveByProduct.get(String(p.id));
              return (
                <View
                  key={String(p.id)}
                  style={{
                    backgroundColor: colors.card2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "900" }}>
                    {p.name}{" "}
                    <Text style={{ color: colors.accent, fontWeight: "900" }}>
                      · {String(p.unit ?? "").toUpperCase()}
                    </Text>
                  </Text>
                  <Text
                    style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}
                  >
                    Último movimiento:{" "}
                    <Text style={{ color: colors.text, fontWeight: "900" }}>
                      {last ? new Date(last).toLocaleString() : "Nunca"}
                    </Text>
                  </Text>
                </View>
              );
            })}
          </View>
        )}
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
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
          Movimientos recientes (periodo)
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Ajustes de inventario en los últimos {days} días.
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        {adjustmentsInPeriod.length === 0 ? (
          <Text style={{ color: colors.muted }}>(Sin movimientos)</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {adjustmentsInPeriod.slice(0, 15).map((a: any) => (
              <View
                key={String(a.id)}
                style={{
                  backgroundColor: colors.card2,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "900" }}>
                  {String(a.reason ?? "Ajuste")}{" "}
                  <Text style={{ color: colors.muted, fontWeight: "700" }}>
                    ({Number(a.delta ?? 0) > 0 ? `+${a.delta}` : `${a.delta}`})
                  </Text>
                </Text>
                <Text
                  style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}
                >
                  {new Date(String(a.createdAt ?? "")).toLocaleString()}
                  {a.note ? ` · ${a.note}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton
            title="EXPORTAR REPORTES"
            onPress={() => router.push("/(tabs)/reports/export" as any)}
            variant="primary"
          />
          <AppButton
            title="VOLVER A REPORTES"
            onPress={() => router.replace("/(tabs)/reports" as any)}
            variant="secondary"
          />
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <AppButton
          title="VOLVER A REPORTES"
          onPress={() => router.replace("/(tabs)/reports" as any)}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}
