// app/(tabs)/sales/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import {
  inventoryActions,
  useInventoryStore,
} from "@/src/store/inventoryStore";
import { salesActions, useSalesStore } from "@/src/store/salesStore";

import type { CartItem } from "@/src/types/sales";

export default function SalesIndex() {
  const router = useRouter();
  const { colors } = useTheme();

  const authUser = useAuthStore((s) => s.user);

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const allProducts = useInventoryStore((s) => s.products ?? []);
  const cart = useSalesStore((s) => s.cart ?? []);

  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      if (authUser?.id) {
        await salesActions.bootstrap(authUser.id);
        await inventoryActions.bootstrap(authUser.id);
      } else {
        await inventoryActions.bootstrap();
      }

      if (!alive) return;

      if (activeBusinessId) {
        await inventoryActions.loadProducts(activeBusinessId);
        if (authUser?.id) await salesActions.loadSales(activeBusinessId);
      }
    })();

    return () => {
      alive = false;
    };
  }, [authUser?.id, activeBusinessId]);

  const products = useMemo(() => {
    if (!activeBusinessId) return [];
    const base = allProducts.filter((p) => p.businessId === activeBusinessId);

    const term = q.trim().toLowerCase();
    if (!term) return base;

    return base.filter((p) => {
      const name = String(p.name ?? "").toLowerCase();
      const sku = String(p.sku ?? "").toLowerCase();
      const barcode = String(p.barcode ?? "").toLowerCase();
      return (
        name.includes(term) || sku.includes(term) || barcode.includes(term)
      );
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
            title="IR A DASHBOARD"
            onPress={() => router.replace("/dashboard" as any)}
          />
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}
            >
              Ventas
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Busca productos y agrégalos al carrito.
            </Text>
          </View>

          <AppButton
            title={`CARRITO (${cart.length})`}
            onPress={() => router.push("/sales/cart" as any)}
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

        <AppInput
          label="Buscar producto"
          value={q}
          onChangeText={(t: string) => setQ(t)}
          placeholder="Nombre, SKU o código de barras"
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
          Catálogo
        </Text>

        <View style={{ gap: 10 }}>
          {products.length === 0 ? (
            <Text style={{ color: colors.muted }}>(No hay productos)</Text>
          ) : (
            products.map((p) => (
              <View
                key={String(p.id)}
                style={{
                  backgroundColor: colors.pillBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {/* ✅ Miniatura */}
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card2,
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {p.imageUri ? (
                      <Image
                        source={{ uri: String(p.imageUri) }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ color: colors.muted, fontSize: 10 }}>
                        Sin foto
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "900",
                        fontSize: 14,
                      }}
                    >
                      {p.name}{" "}
                      <Text style={{ color: colors.accent, fontWeight: "900" }}>
                        · {String(p.unit ?? "").toUpperCase()}
                      </Text>
                    </Text>

                    <Text
                      style={{
                        color: colors.muted,
                        marginTop: 4,
                        fontSize: 12,
                      }}
                    >
                      ${Number(p.price ?? 0).toFixed(2)}
                      {p.sku ? ` · SKU: ${p.sku}` : ""}
                      {p.barcode ? ` · CB: ${p.barcode}` : ""}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      const payload: Omit<CartItem, "qty"> = {
                        productId: p.id,
                        name: p.name,
                        price: p.price,
                        unit: p.unit,
                        sku: p.sku,
                        barcode: p.barcode,
                      };
                      salesActions.addToCart(payload);
                    }}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.accentSoft,
                    }}
                  >
                    <Ionicons name="add" size={20} color={colors.accent} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

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
          Ventas
        </Text>

        <View style={{ gap: 10 }}>
          <AppButton
            title="VER HISTORIAL DE VENTAS"
            onPress={() => router.push("/sales/sales-history" as any)}
            variant="secondary"
          />
          <AppButton
            title="IR AL CARRITO"
            onPress={() => router.push("/sales/cart" as any)}
            variant="primary"
          />
        </View>
      </View>
    </Screen>
  );
}
