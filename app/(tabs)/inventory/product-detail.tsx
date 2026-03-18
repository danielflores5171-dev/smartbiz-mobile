import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import {
  inventoryActions,
  useInventoryStore,
} from "@/src/store/inventoryStore";

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
            Consulta del detalle, acceso a editar, ajuste de stock y eliminación
            del producto ya siguen el flujo conectado a web; falta autorización
            Bearer/cookies para operar en backend real.
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
            Parte de la visualización enriquecida, ciertos respaldos locales y
            complementos del historial del producto siguen en modo demo y se
            ampliarán en futuras actualizaciones.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ProductDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const token = useAuthStore((s) => s.token);

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const allProducts = useInventoryStore((s) => s.products ?? []);

  const product = useMemo(() => {
    if (!id) return null;
    return allProducts.find((p) => p.id === id) ?? null;
  }, [allProducts, id]);

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
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
            {product.name}
          </Text>

          <Text style={{ color: colors.muted, marginTop: 6 }}>
            SKU: {product.sku ?? "—"} · Unidad: {product.unit}
          </Text>

          <StatusBanner />

          <View style={{ marginTop: 14 }}>
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              Stock:{" "}
              <Text style={{ color: colors.accent, fontWeight: "900" }}>
                {product.stock}
              </Text>
            </Text>

            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Precio: ${product.price.toFixed(2)} · Costo: $
              {product.cost.toFixed(2)}
            </Text>

            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Mínimo: {product.minStock ?? "—"} · Estado: {product.status}
            </Text>
          </View>

          <View style={{ marginTop: 16, gap: 10 }}>
            <AppButton
              title="AJUSTAR STOCK"
              onPress={() =>
                router.push({
                  pathname: "/inventory/adjust",
                  params: { id: product.id },
                } as any)
              }
              variant="primary"
            />

            <AppButton
              title="EDITAR"
              onPress={() =>
                router.push({
                  pathname: "/inventory/product-edit",
                  params: { id: product.id },
                } as any)
              }
              variant="secondary"
            />

            <AppButton
              title="ELIMINAR"
              onPress={() =>
                Alert.alert(
                  "Eliminar producto",
                  "¿Seguro que quieres eliminar este producto?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar",
                      style: "destructive",
                      onPress: async () => {
                        console.log(
                          "[ProductDetail] delete productId=",
                          product.id,
                          "businessId=",
                          product.businessId,
                          "tokenHead=",
                          String(token ?? "").slice(0, 10),
                        );
                        await inventoryActions.deleteProduct(
                          product.id,
                          token ?? undefined,
                        );
                        console.log("[ProductDetail] delete OK");
                        router.replace("/inventory" as any);
                      },
                    },
                  ],
                )
              }
              variant="secondary"
              style={{
                backgroundColor: colors.accentSoft,
                borderColor: colors.border,
              }}
            />

            <AppButton
              title="VOLVER"
              onPress={() => router.replace("/inventory" as any)}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
