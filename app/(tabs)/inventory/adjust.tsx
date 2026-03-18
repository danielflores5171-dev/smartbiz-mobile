import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import type { StockReason } from "@/src/types/inventory";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

import { useAuthStore } from "@/src/store/authStore";
import {
  inventoryActions,
  useInventoryStore,
} from "@/src/store/inventoryStore";

const REASONS: StockReason[] = [
  "Compra / reposición",
  "Venta",
  "Merma / caducidad",
  "Ajuste de inventario",
  "Devolución",
  "Otro",
];

function StatusBanner() {
  const { colors } = useTheme();

  return (
    <View
      style={{
        marginTop: 12,
        marginBottom: 14,
        backgroundColor: colors.card2,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 14,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
        Estado del módulo
      </Text>

      <View
        style={{
          height: 1,
          backgroundColor: colors.divider,
          marginVertical: 12,
        }}
      />

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
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
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 15 }}>
            Conectado con web • falta autorización
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>
            Ajuste de stock, envío de cantidad, motivo y nota ya están
            preparados para backend/web; falta autorización Bearer/cookies para
            aplicar el movimiento real en servidor.
          </Text>
        </View>
      </View>

      <View style={{ height: 12 }} />

      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
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
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 15 }}>
            Local/demo • se añadirá en próximas actualizaciones
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>
            Respaldo local del ajuste y parte del historial de movimientos
            siguen funcionando como demo mientras la autorización o integración
            completa con web termina de cerrarse.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function AdjustStock() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const token = useAuthStore((s) => s.token);

  const product = useInventoryStore((s) =>
    (s.products ?? []).find((p) => p.id === id),
  );

  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState<StockReason>("Ajuste de inventario");
  const [note, setNote] = useState("");

  const can = useMemo(() => {
    const n = Number(delta);
    return !!product && !Number.isNaN(n) && n !== 0;
  }, [delta, product]);

  if (!product) {
    return (
      <Screen center padded>
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Producto no encontrado.
        </Text>
        <View style={{ marginTop: 12 }}>
          <AppButton
            title="IR A INVENTARIO"
            onPress={() => router.replace("/inventory" as any)}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>
            Ajustar stock
          </Text>

          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Producto:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {product.name}
            </Text>
          </Text>

          <StatusBanner />

          <AppInput
            label="Cantidad (usa negativo para restar)"
            value={delta}
            onChangeText={setDelta}
            keyboardType={"numbers-and-punctuation" as any}
            placeholder="Ej. 5 o -2"
          />

          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>
            Motivo
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 8,
            }}
          >
            {REASONS.map((r) => {
              const active = reason === r;
              return (
                <AppButton
                  key={r}
                  title={r}
                  onPress={() => setReason(r)}
                  variant="secondary"
                  fullWidth={false}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: active ? colors.accentSoft : undefined,
                    borderColor: colors.border,
                  }}
                />
              );
            })}
          </View>

          <AppInput
            label="Nota (opcional)"
            value={note}
            onChangeText={setNote}
            placeholder="Ej. se ajustó por conteo físico..."
          />

          <View style={{ marginTop: 16, gap: 10 }}>
            <AppButton
              title="GUARDAR AJUSTE"
              disabled={!can}
              onPress={async () => {
                if (!can) return;

                console.log(
                  "[AdjustStock] save productId=",
                  product.id,
                  "businessId=",
                  product.businessId,
                  "delta=",
                  Number(delta),
                  "reason=",
                  reason,
                  "tokenHead=",
                  String(token ?? "").slice(0, 10),
                );

                await inventoryActions.adjustStock(
                  {
                    productId: product.id,
                    delta: Number(delta),
                    reason,
                    note: note.trim() || undefined,
                  },
                  token ?? undefined,
                );

                console.log("[AdjustStock] save OK");
                router.replace("/inventory" as any);
              }}
              variant="primary"
            />

            <AppButton
              title="CANCELAR"
              onPress={() => router.replace("/inventory" as any)}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
