// app/(tabs)/inventory/create.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { inventoryActions } from "@/src/store/inventoryStore";
import type { Unit } from "@/src/types/inventory";

import { productImageService } from "@/src/services/productImageService";
import { useAuthStore } from "@/src/store/authStore";

const UNITS: Unit[] = ["pz", "kg", "lt", "caja"];

export default function InventoryCreate() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const authUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState<Unit>("pz");
  const [price, setPrice] = useState("0");
  const [cost, setCost] = useState("0");
  const [stock, setStock] = useState("0");
  const [minStock, setMinStock] = useState("");

  const [tempImageUri, setTempImageUri] = useState<string | null>(null);

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

  const pickImage = async () => {
    const uri = await productImageService.pickFromLibrary();
    if (uri) setTempImageUri(uri);
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
                Se intenta sincronizar con backend; si no autoriza, cae a demo.
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
              marginBottom: 12,
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}
            >
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
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
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
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 14,
                  }}
                >
                  Conectado con web • falta autorización
                </Text>
                <Text
                  style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}
                >
                  El alta de producto, estructura de campos, guardado principal
                  y asociación de imagen ya coinciden con la web; falta
                  autorización Bearer/cookies y completar el ajuste web de
                  imágenes/rutas para persistencia remota total.
                </Text>
              </View>
            </View>

            <View style={{ height: 12 }} />

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
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
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 14,
                  }}
                >
                  Local/demo • se añadirá en próximas actualizaciones
                </Text>
                <Text
                  style={{ color: colors.muted, marginTop: 6, lineHeight: 22 }}
                >
                  El picker de imagen, el respaldo local del producto y el
                  fallback de subida/adjunto siguen funcionando en demo mientras
                  backend no autoriza o aún faltan ajustes finales de imágenes
                  en próximas actualizaciones.
                </Text>
              </View>
            </View>
          </View>

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
              {tempImageUri ? (
                <Image
                  source={{ uri: tempImageUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  Sin foto
                </Text>
              )}
            </View>

            <View style={{ flex: 1, gap: 10 }}>
              <AppButton
                title={tempImageUri ? "CAMBIAR IMAGEN" : "AGREGAR IMAGEN"}
                onPress={pickImage}
                variant="secondary"
              />
              {tempImageUri ? (
                <AppButton
                  title="QUITAR"
                  onPress={() => setTempImageUri(null)}
                  variant="secondary"
                />
              ) : null}
            </View>
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

                console.log(
                  "[InventoryCreate] save businessId=",
                  activeBusinessId,
                  "name=",
                  name.trim(),
                  "tokenHead=",
                  String(token ?? "").slice(0, 10),
                );

                const created = await inventoryActions.createProduct(
                  {
                    businessId: activeBusinessId,
                    name: name.trim(),
                    sku: sku.trim() || undefined,
                    barcode: barcode.trim() || undefined,
                    unit,
                    price: Number(price) || 0,
                    cost: Number(cost) || 0,
                    stock: Number(stock) || 0,
                    minStock: minStock.trim()
                      ? Number(minStock) || 0
                      : undefined,
                    status: "active",
                  },
                  token ?? undefined,
                );

                if (tempImageUri && authUser?.id) {
                  try {
                    const stableUri = await productImageService.saveForProduct({
                      userId: authUser.id,
                      productId: String(created.id),
                      pickedUri: tempImageUri,
                    });

                    console.log(
                      "[InventoryCreate] attach image productId=",
                      created.id,
                      "tokenHead=",
                      String(token ?? "").slice(0, 10),
                    );

                    await inventoryActions.attachProductImage(
                      created.id,
                      stableUri,
                      token ?? undefined,
                    );
                  } catch (e) {
                    console.warn("No se pudo guardar/subir imagen:", e);
                  }
                }

                console.log("[InventoryCreate] save OK productId=", created.id);
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
