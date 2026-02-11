// app/(tabs)/inventory/create.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { inventoryActions } from "@/src/store/inventoryStore";
import type { Unit } from "@/src/types/inventory";

const UNITS: Unit[] = ["pz", "kg", "lt", "caja"];

export default function InventoryCreate() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState<Unit>("pz");
  const [price, setPrice] = useState("0");
  const [cost, setCost] = useState("0");
  const [stock, setStock] = useState("0");
  const [minStock, setMinStock] = useState("");

  const can = useMemo(
    () => name.trim().length >= 2 && !!activeBusinessId,
    [name, activeBusinessId],
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
            onPress={() => router.replace("/business" as any)}
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
          {/* Header + Volver */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}
              >
                Crear producto
              </Text>
              <Text style={{ color: colors.muted, marginTop: 6 }}>
                (Demo) Se guarda local y persiste.
              </Text>
            </View>

            <AppButton
              title="VOLVER"
              onPress={() => router.back()}
              variant="secondary"
              fullWidth={false}
            />
          </View>

          <AppInput
            label="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Coca Cola 600ml"
          />
          <AppInput
            label="SKU (opcional)"
            value={sku}
            onChangeText={setSku}
            placeholder="SKU-001"
            autoCapitalize="none"
          />
          <AppInput
            label="Código de barras (opcional)"
            value={barcode}
            onChangeText={setBarcode}
            placeholder="750..."
            autoCapitalize="none"
          />

          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>
            Unidad
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 8,
            }}
          >
            {UNITS.map((u) => {
              const active = unit === u;
              return (
                <AppButton
                  key={u}
                  title={u.toUpperCase()}
                  onPress={() => setUnit(u)}
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
            label="Precio venta"
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            keyboardType="numeric"
          />
          <AppInput
            label="Costo"
            value={cost}
            onChangeText={setCost}
            placeholder="0"
            keyboardType="numeric"
          />
          <AppInput
            label="Stock inicial"
            value={stock}
            onChangeText={setStock}
            placeholder="0"
            keyboardType="numeric"
          />
          <AppInput
            label="Stock mínimo (opcional)"
            value={minStock}
            onChangeText={setMinStock}
            placeholder="2"
            keyboardType="numeric"
          />

          <View style={{ marginTop: 16, gap: 10 }}>
            <AppButton
              title="GUARDAR"
              onPress={async () => {
                if (!can) return;

                await inventoryActions.createProduct({
                  businessId: activeBusinessId,
                  name: name.trim(),
                  sku: sku.trim() || undefined,
                  barcode: barcode.trim() || undefined,
                  unit,
                  price: Number(price) || 0,
                  cost: Number(cost) || 0,
                  stock: Number(stock) || 0,
                  minStock: minStock.trim() ? Number(minStock) || 0 : undefined,
                  status: "active",
                });

                router.replace("/inventory" as any);
              }}
              disabled={!can}
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
