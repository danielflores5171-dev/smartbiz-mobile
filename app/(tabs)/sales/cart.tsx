// app/(tabs)/sales/cart.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppInput from "@/src/ui/AppInput";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { salesActions, useSalesStore } from "@/src/store/salesStore";

function parseMoney(input: string) {
  const v = Number(String(input ?? "").replace(",", "."));
  return Number.isFinite(v) ? Math.max(0, v) : 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function CartScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const cart = useSalesStore((s) => s.cart ?? []);
  const discount = useSalesStore((s) => s.discount ?? 0);

  const [discountStr, setDiscountStr] = useState(String(discount || 0));

  const subtotal = useMemo(
    () =>
      round2(
        cart.reduce(
          (acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 0),
          0,
        ),
      ),
    [cart],
  );

  const discountNum = useMemo(() => parseMoney(discountStr), [discountStr]);

  const total = useMemo(() => {
    const d = Math.min(discountNum, subtotal);
    return round2(Math.max(0, subtotal - d));
  }, [subtotal, discountNum]);

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
              Carrito
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              Ajusta cantidades y pasa a cobrar.
            </Text>
          </View>

          <AppButton
            title="CANCELAR"
            onPress={() => router.replace("/sales" as any)}
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

        {cart.length === 0 ? (
          <>
            <Text style={{ color: colors.muted }}>(Tu carrito está vacío)</Text>
            <View style={{ marginTop: 14 }}>
              <AppButton
                title="AGREGAR PRODUCTOS"
                onPress={() => router.replace("/sales" as any)}
                variant="primary"
              />
            </View>
          </>
        ) : (
          <>
            <View style={{ gap: 10 }}>
              {cart.map((it) => (
                <View
                  key={String(it.productId)}
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
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "900" }}>
                        {it.name}{" "}
                        <Text
                          style={{ color: colors.accent, fontWeight: "900" }}
                        >
                          · {String(it.unit ?? "").toUpperCase()}
                        </Text>
                      </Text>
                      <Text
                        style={{
                          color: colors.muted,
                          marginTop: 4,
                          fontSize: 12,
                        }}
                      >
                        ${(Number(it.price) || 0).toFixed(2)}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        salesActions.removeFromCart(it.productId as any)
                      }
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.dangerBorder,
                        backgroundColor: colors.dangerBg,
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.dangerText}
                      />
                    </Pressable>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    <Pressable
                      onPress={() => salesActions.dec(it.productId as any)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: isDark ? colors.card2 : colors.pillBg,
                      }}
                    >
                      <Ionicons name="remove" size={20} color={colors.text} />
                    </Pressable>

                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: "900",
                          fontSize: 16,
                        }}
                      >
                        {Number(it.qty) || 0}{" "}
                        {String(it.unit ?? "").toUpperCase()}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                        Cantidad
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => salesActions.inc(it.productId as any)}
                      style={{
                        width: 44,
                        height: 44,
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
              ))}
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: colors.divider,
                marginVertical: 16,
              }}
            />

            <AppInput
              label="Descuento (pesos)"
              value={discountStr}
              onChangeText={(t: string) => {
                setDiscountStr(t);
                salesActions.setDiscount(parseMoney(t));
              }}
              keyboardType="number-pad"
              placeholder="0"
            />

            <View style={{ marginTop: 12, gap: 6 }}>
              <Text style={{ color: colors.muted }}>
                Subtotal:{" "}
                <Text style={{ color: colors.text, fontWeight: "900" }}>
                  ${subtotal.toFixed(2)}
                </Text>
              </Text>

              <Text style={{ color: colors.muted }}>
                Descuento:{" "}
                <Text style={{ color: colors.text, fontWeight: "900" }}>
                  ${Math.min(discountNum, subtotal).toFixed(2)}
                </Text>
              </Text>

              <Text style={{ color: colors.muted }}>
                Total:{" "}
                <Text style={{ color: colors.text, fontWeight: "900" }}>
                  ${total.toFixed(2)}
                </Text>
              </Text>
            </View>

            <View style={{ marginTop: 16, gap: 10 }}>
              <AppButton
                title="IR A COBRAR"
                onPress={() => router.push("/sales/checkout" as any)}
                variant="primary"
              />

              <AppButton
                title="VACIAR CARRITO"
                onPress={() =>
                  Alert.alert("Vaciar carrito", "¿Seguro?", [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Vaciar",
                      style: "destructive",
                      onPress: () => salesActions.clearCart(),
                    },
                  ])
                }
                variant="secondary"
                style={{
                  backgroundColor: colors.dangerBg,
                  borderColor: colors.dangerBorder,
                }}
              />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
