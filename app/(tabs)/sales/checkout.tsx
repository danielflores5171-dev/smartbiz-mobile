// app/(tabs)/sales/checkout.tsx
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
import type { PaymentMethod } from "@/src/types/sales";

const METHODS: { label: string; value: PaymentMethod; icon: any }[] = [
  { label: "Efectivo", value: "cash", icon: "cash-outline" },
  { label: "Tarjeta", value: "card", icon: "card-outline" },
  {
    label: "Transferencia",
    value: "transfer",
    icon: "swap-horizontal-outline",
  },
  { label: "Otro", value: "other", icon: "ellipsis-horizontal" },
];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function parseMoney(input: string) {
  const v = Number(String(input ?? "").replace(",", "."));
  return Number.isFinite(v) ? round2(Math.max(0, v)) : 0;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const cart = useSalesStore((s) => s.cart ?? []);
  const discount = useSalesStore((s) => s.discount ?? 0);

  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidStr, setPaidStr] = useState("");
  const [note, setNote] = useState("");

  const TAX_RATE = 0.16;

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

  const discountSafe = useMemo(
    () => round2(Math.max(0, Math.min(discount || 0, subtotal))),
    [discount, subtotal],
  );

  const base = useMemo(
    () => round2(Math.max(0, subtotal - discountSafe)),
    [subtotal, discountSafe],
  );
  const iva = useMemo(() => round2(base * TAX_RATE), [base]);
  const total = useMemo(() => round2(base + iva), [base, iva]);

  const paidCash = useMemo(() => parseMoney(paidStr), [paidStr]);

  const paid = useMemo(
    () => (method === "cash" ? paidCash : total),
    [method, paidCash, total],
  );

  const change = useMemo(
    () => round2(Math.max(0, paid - total)),
    [paid, total],
  );

  const canPay = useMemo(() => {
    if (cart.length === 0) return false;
    if (total <= 0) return false;
    if (method === "cash") return paidCash >= total;
    return true;
  }, [cart.length, method, paidCash, total]);

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

  if (cart.length === 0) {
    return (
      <Screen center padded>
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          (Tu carrito está vacío)
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
              Cobrar
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              IVA {Math.round(TAX_RATE * 100)}% aplicado (demo).
            </Text>
          </View>

          <AppButton
            title="CANCELAR"
            onPress={() => router.replace("/sales/cart" as any)}
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

        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Método de pago
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 10,
          }}
        >
          {METHODS.map((m) => {
            const active = method === m.value;
            return (
              <Pressable
                key={m.value}
                onPress={() => setMethod(m.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active
                    ? colors.inputBorderEmphasis
                    : colors.border,
                  backgroundColor: active ? colors.pillBgActive : colors.pillBg,
                }}
              >
                <Ionicons
                  name={m.icon}
                  size={16}
                  color={active ? colors.accent : colors.muted}
                />
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppInput
          label={method === "cash" ? "Pagó (efectivo)" : "Pagó (auto)"}
          value={method === "cash" ? paidStr : String(total)}
          onChangeText={(t: string) => setPaidStr(t)}
          keyboardType="number-pad"
          placeholder={String(total)}
          editable={method === "cash"}
          emphasis={method === "cash"}
        />

        <AppInput
          label="Nota (opcional)"
          value={note}
          onChangeText={(t: string) => setNote(t)}
          placeholder="Ej. Cliente frecuente"
        />

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text style={{ color: colors.muted }}>
          Subtotal:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${subtotal.toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted }}>
          Descuento:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${discountSafe.toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted }}>
          Base:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${base.toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted }}>
          IVA:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${iva.toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Total:{" "}
          <Text style={{ color: colors.accent, fontWeight: "900" }}>
            ${total.toFixed(2)}
          </Text>
        </Text>

        {method === "cash" ? (
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Cambio:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${change.toFixed(2)}
            </Text>
          </Text>
        ) : null}

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="CONFIRMAR VENTA"
            disabled={!canPay}
            onPress={async () => {
              try {
                const sale = await salesActions.checkout({
                  businessId: activeBusinessId,
                  paymentMethod: method,
                  paid,
                  note: note.trim() || undefined,
                  taxRate: TAX_RATE,
                });

                router.replace({
                  pathname: "/sales/sales-detail",
                  params: { id: sale.id },
                } as any);
              } catch (e: any) {
                Alert.alert(
                  "Error",
                  e?.message ?? "No se pudo completar la venta",
                );
              }
            }}
            variant="primary"
          />

          <AppButton
            title="VER HISTORIAL"
            onPress={() => router.replace("/sales/sales-history" as any)}
            variant="secondary"
          />

          <AppButton
            title="VOLVER AL CARRITO"
            onPress={() => router.replace("/sales/cart" as any)}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
}
