// app/(tabs)/inventory/index.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import ProductCard from "@/src/ui/ProductCard";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import {
  inventoryActions,
  useInventoryStore,
} from "@/src/store/inventoryStore";

export default function InventoryIndex() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const allProducts = useInventoryStore((s) => s.products ?? []);
  const loading = useInventoryStore((s) => s.loading);

  const [q, setQ] = useState("");

  useEffect(() => {
    void inventoryActions.bootstrap();
  }, []);

  useEffect(() => {
    if (!activeBusinessId) return;
    void inventoryActions.loadProducts(activeBusinessId);
  }, [activeBusinessId]);

  const products = useMemo(() => {
    if (!activeBusinessId) return [];
    const list = allProducts.filter((p) => p.businessId === activeBusinessId);
    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter((p) => {
      const hay = `${p.name} ${p.sku ?? ""} ${p.barcode ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [allProducts, activeBusinessId, q]);

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
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
            Inventario
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            (Demo) Datos locales + persistencia.
          </Text>

          <View style={{ marginTop: 14 }}>
            <AppButton
              title="CREAR PRODUCTO"
              onPress={() => router.push("/inventory/create" as any)}
              variant="primary"
            />
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              marginVertical: 16,
            }}
          />

          <AppInput
            label="Buscar"
            value={q}
            onChangeText={setQ}
            placeholder="Nombre, SKU, código..."
            autoCapitalize="none"
          />

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              marginVertical: 16,
            }}
          />

          <Text
            style={{ color: colors.text, fontWeight: "900", marginBottom: 10 }}
          >
            Lista {loading ? "(cargando...)" : ""}
          </Text>

          <View style={{ gap: 10 }}>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onPress={() =>
                  router.push({
                    pathname: "/inventory/product-detail",
                    params: { id: p.id },
                  } as any)
                }
              />
            ))}

            {products.length === 0 ? (
              <Text style={{ color: colors.muted }}>
                (Aún no hay productos)
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
