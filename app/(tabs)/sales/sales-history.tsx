// app/(tabs)/sales/sales-history.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { useInventoryStore } from "@/src/store/inventoryStore";
import { salesActions, useSalesStore } from "@/src/store/salesStore";
import type { ID } from "@/src/types/business";
import type { Sale } from "@/src/types/sales";

function safeDate(input: unknown): Date | null {
  const d = input instanceof Date ? input : new Date(String(input ?? ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function SalesHistory() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);

  const sales = useSalesStore((s) => {
    if (!activeBusinessId) return [] as Sale[];
    return (s.salesByBusiness?.[String(activeBusinessId)] ?? []) as Sale[];
  });

  // ✅ para sacar miniatura (primer producto de la venta)
  const allProducts = useInventoryStore((s) => s.products ?? []);
  const productById = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of allProducts) map.set(String(p.id), p);
    return map;
  }, [allProducts]);

  const sorted = useMemo(() => {
    return [...sales].sort((a, b) => {
      const ta = safeDate(a.createdAt)?.getTime() ?? 0;
      const tb = safeDate(b.createdAt)?.getTime() ?? 0;
      return tb - ta;
    });
  }, [sales]);

  if (!activeBusinessId) {
    return (
      <Screen center padded>
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Primero selecciona un negocio.
        </Text>
        <View style={{ marginTop: 12 }}>
          <AppButton
            title="IR A VENTAS"
            onPress={() => router.replace("/sales" as any)}
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
              Historial de ventas
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Ventas registradas (demo).
            </Text>
          </View>

          <AppButton
            title="RECARGAR UI"
            onPress={() =>
              Alert.alert("Listo", "Historial actualizado (local).")
            }
            variant="secondary"
            fullWidth={false}
          />

          <AppButton
            title="CERRAR"
            onPress={() => router.replace("/sales" as any)}
            variant="secondary"
            fullWidth={false}
          />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          {sorted.length === 0 ? (
            <Text style={{ color: colors.muted }}>(Aún no hay ventas)</Text>
          ) : (
            sorted.map((s: Sale) => {
              const created = safeDate(s.createdAt);
              const total = Number(s.total ?? 0);

              const firstItem = (s.items?.[0] as any) ?? null;
              const firstProductId = firstItem?.productId
                ? String(firstItem.productId)
                : "";
              const prd = firstProductId
                ? productById.get(firstProductId)
                : null;
              const imageUri = prd?.imageUri ? String(prd.imageUri) : null;

              return (
                <View
                  key={String(s.id)}
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
                    {/* ✅ Miniatura preview */}
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
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
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ color: colors.muted, fontSize: 10 }}>
                          —
                        </Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "900" }}>
                        Venta{" "}
                        <Text
                          style={{ color: colors.accent, fontWeight: "900" }}
                        >
                          ${total.toFixed(2)}
                        </Text>
                      </Text>

                      <Text
                        style={{
                          color: colors.muted,
                          marginTop: 4,
                          fontSize: 12,
                        }}
                      >
                        {created ? created.toLocaleString() : "Fecha inválida"}{" "}
                        · {String(s.paymentMethod ?? "")}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          "Eliminar venta",
                          "¿Seguro que quieres eliminar esta venta del historial? (demo)",
                          [
                            { text: "Cancelar", style: "cancel" },
                            {
                              text: "Eliminar",
                              style: "destructive",
                              onPress: () =>
                                salesActions.deleteSale(
                                  activeBusinessId as ID,
                                  s.id as ID,
                                ),
                            },
                          ],
                        )
                      }
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.dangerBorder,
                        backgroundColor: colors.dangerBg,
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={colors.dangerText}
                      />
                    </Pressable>
                  </View>

                  <View
                    style={{
                      marginTop: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/sales/sales-detail", // ✅ FIX (antes /sales/receipt)
                          params: { id: s.id },
                        } as any)
                      }
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingVertical: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.accentSoft,
                      }}
                    >
                      <Ionicons
                        name="receipt-outline"
                        size={18}
                        color={colors.accent}
                      />
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: "900",
                          fontSize: 12,
                        }}
                      >
                        Ticket / detalle
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          "Descargar / Imprimir",
                          "Demo: abre el ticket y usa el botón de descarga.",
                          [
                            {
                              text: "Abrir ticket",
                              onPress: () =>
                                router.push({
                                  pathname: "/sales/sales-detail", // ✅ FIX
                                  params: { id: s.id },
                                } as any),
                            },
                            { text: "Cancelar", style: "cancel" },
                          ],
                        )
                      }
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.pillBg,
                      }}
                    >
                      <Ionicons
                        name="download-outline"
                        size={20}
                        color={colors.muted}
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </Screen>
  );
}
