import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

import {
  inventoryActions,
  useInventoryStore,
} from "@/src/store/inventoryStore";
import type { Unit } from "@/src/types/inventory";

import { productImageService } from "@/src/services/productImageService";
import { useAuthStore } from "@/src/store/authStore";

const UNITS: Unit[] = ["pz", "kg", "lt", "caja"];

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
            Edición de datos principales, actualización de imagen y guardado del
            producto ya están alineados con web/backend; falta autorización
            Bearer/cookies para persistir todo en entorno real.
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
            Algunos respaldos de imagen, persistencia auxiliar local y
            comportamientos demo siguen activos mientras se completa la
            sincronización total con web.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ProductEdit() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const authUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const product = useInventoryStore((s) =>
    (s.products ?? []).find((p) => p.id === id),
  );

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState<Unit>("pz");
  const [price, setPrice] = useState("0");
  const [cost, setCost] = useState("0");
  const [minStock, setMinStock] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setName(product.name ?? "");
    setSku(product.sku ?? "");
    setBarcode(product.barcode ?? "");
    setUnit((product.unit as Unit) ?? "pz");
    setPrice(String(product.price ?? 0));
    setCost(String(product.cost ?? 0));
    setMinStock(product.minStock != null ? String(product.minStock) : "");
    setImageUri((product.imageUrl as any) ?? (product.imageUri as any) ?? null);
  }, [product?.id, product?.updatedAt, product?.imageUrl, product?.imageUri]);

  const can = useMemo(
    () => name.trim().length >= 2 && !!product,
    [name, product],
  );

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

  const pickAndAttach = async () => {
    const picked = await productImageService.pickFromLibrary();
    if (!picked) return;
    if (!authUser?.id) return;

    const stableUri = await productImageService.saveForProduct({
      userId: authUser.id,
      productId: String(product.id),
      pickedUri: picked,
    });

    console.log(
      "[ProductEdit] update image productId=",
      product.id,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    setImageUri(stableUri);

    await inventoryActions.attachProductImage(
      product.id,
      stableUri,
      token ?? undefined,
    );
  };

  const removeImage = async () => {
    if (!authUser?.id) return;

    await productImageService.removeProductImage({
      userId: authUser.id,
      productId: String(product.id),
    });

    console.log(
      "[ProductEdit] remove image productId=",
      product.id,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    setImageUri(null);

    await inventoryActions.removeProductImage(product.id, token ?? undefined);
  };

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
            Editar producto
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Cambia los datos del producto.
          </Text>

          <StatusBanner />

          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>
            Imagen (opcional)
          </Text>

          <View
            style={{
              marginTop: 8,
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 74,
                height: 74,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card2,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  Sin foto
                </Text>
              )}
            </View>

            <View style={{ flex: 1, gap: 10 }}>
              <AppButton
                title={imageUri ? "CAMBIAR IMAGEN" : "AGREGAR IMAGEN"}
                onPress={pickAndAttach}
                variant="secondary"
              />
              {imageUri ? (
                <AppButton
                  title="QUITAR"
                  onPress={removeImage}
                  variant="secondary"
                />
              ) : null}
            </View>
          </View>

          <AppInput
            label="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="Nombre del producto"
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
            keyboardType="numeric"
          />
          <AppInput
            label="Costo"
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />
          <AppInput
            label="Stock mínimo (opcional)"
            value={minStock}
            onChangeText={setMinStock}
            keyboardType="numeric"
            placeholder="2"
          />

          <View style={{ marginTop: 16, gap: 10 }}>
            <AppButton
              title="GUARDAR CAMBIOS"
              disabled={!can}
              onPress={async () => {
                if (!can) return;

                console.log(
                  "[ProductEdit] save productId=",
                  product.id,
                  "businessId=",
                  product.businessId,
                  "tokenHead=",
                  String(token ?? "").slice(0, 10),
                );

                await inventoryActions.updateProduct(
                  product.id,
                  {
                    name: name.trim(),
                    sku: sku.trim() || undefined,
                    barcode: barcode.trim() || undefined,
                    unit,
                    price: Number(price) || 0,
                    cost: Number(cost) || 0,
                    minStock: minStock.trim()
                      ? Number(minStock) || 0
                      : undefined,
                  },
                  token ?? undefined,
                );

                console.log("[ProductEdit] save OK");
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
