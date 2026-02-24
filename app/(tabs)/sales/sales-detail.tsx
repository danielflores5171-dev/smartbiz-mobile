// app/(tabs)/sales/sales-detail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { useInventoryStore } from "@/src/store/inventoryStore";
import { useSalesStore } from "@/src/store/salesStore";
import type { CartItem, Sale } from "@/src/types/sales";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function normalizeParamId(id: string | string[] | undefined): string {
  if (!id) return "";
  return Array.isArray(id) ? (id[0] ?? "") : id;
}

function safeDate(input: unknown): Date | null {
  const d = input instanceof Date ? input : new Date(String(input ?? ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

function safeUri(u: unknown): string | null {
  const s = typeof u === "string" ? u.trim() : "";
  return s ? s : null;
}

export default function SalesDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = normalizeParamId(params.id);

  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const sale = useSalesStore((s) => {
    if (!activeBusinessId || !id) return null;
    const list = (s.salesByBusiness?.[String(activeBusinessId)] ??
      []) as Sale[];
    return list.find((x) => String(x.id) === String(id)) ?? null;
  });

  // ✅ resolver imágenes por productId (sale.items no tiene imageUri)
  const allProducts = useInventoryStore((s) => s.products ?? []);
  const productById = useMemo(() => {
    const map = new Map<string, { imageUri?: string | null }>();
    for (const p of allProducts as any[]) {
      map.set(String(p.id), { imageUri: (p as any).imageUri ?? null });
    }
    return map;
  }, [allProducts]);

  const methodLabel = useMemo(() => {
    const m = sale?.paymentMethod;
    if (m === "cash") return "Efectivo";
    if (m === "card") return "Tarjeta";
    if (m === "transfer") return "Transferencia";
    if (m === "other") return "Otro";
    return String(m ?? "—");
  }, [sale?.paymentMethod]);

  const lines = useMemo(() => (sale?.items ?? []) as CartItem[], [sale?.items]);

  const subtotal = round2(Number(sale?.subtotal ?? 0));
  const discount = round2(Number(sale?.discount ?? 0));
  const base = round2(
    Number(sale?.taxableBase ?? Math.max(0, subtotal - discount)),
  );
  const taxRate = Number(sale?.taxRate ?? 0.16);
  const tax = round2(Number(sale?.taxAmount ?? base * taxRate));
  const total = round2(Number(sale?.total ?? base + tax));
  const paid = round2(Number(sale?.paid ?? total));
  const change = round2(Number(sale?.change ?? Math.max(0, paid - total)));

  const createdAt = safeDate(sale?.createdAt);

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
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  if (!sale) {
    return (
      <Screen center padded>
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Venta no encontrada.
        </Text>
        <View style={{ marginTop: 12 }}>
          <AppButton
            title="IR AL HISTORIAL"
            onPress={() => router.replace("/sales/sales-history" as any)}
            variant="primary"
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
              Ticket / Detalle
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              {activeBiz?.name ?? "Negocio"}
              {createdAt ? ` · ${createdAt.toLocaleString()}` : ""}
            </Text>
          </View>

          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.accentSoft,
            }}
          >
            <Ionicons name="receipt-outline" size={18} color={colors.accent} />
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Folio</Text>
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {String(sale.id)}
          </Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Método de pago
          </Text>
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {methodLabel}
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text style={{ color: colors.text, fontWeight: "900" }}>Productos</Text>

        <View style={{ marginTop: 10, gap: 10 }}>
          {lines.length === 0 ? (
            <Text style={{ color: colors.muted }}>(Sin conceptos)</Text>
          ) : (
            lines.map((l: CartItem, idx: number) => {
              const name = String(l.name ?? "Producto");
              const unit = String(l.unit ?? "").toUpperCase();
              const qty = Number(l.qty ?? 1);
              const price = Number(l.price ?? 0);
              const lineTotal = round2(qty * price);

              const prd = productById.get(String(l.productId));
              const imageUri = safeUri(prd?.imageUri);

              return (
                <View
                  key={`${sale.id}-${idx}`}
                  style={{
                    backgroundColor: colors.pillBg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
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
                          Sin foto
                        </Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "900" }}>
                        {name}
                        <Text
                          style={{ color: colors.accent, fontWeight: "900" }}
                        >
                          {" "}
                          · {qty} {unit || ""}
                        </Text>
                      </Text>

                      <Text
                        style={{
                          color: colors.muted,
                          marginTop: 4,
                          fontSize: 12,
                        }}
                      >
                        {qty} × ${price.toFixed(2)} ={" "}
                        <Text style={{ color: colors.text, fontWeight: "900" }}>
                          ${lineTotal.toFixed(2)}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text style={{ color: colors.text, fontWeight: "900" }}>Totales</Text>

        <View style={{ marginTop: 10, gap: 6 }}>
          <Text style={{ color: colors.muted }}>
            Subtotal:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${subtotal.toFixed(2)}
            </Text>
          </Text>

          <Text style={{ color: colors.muted }}>
            Descuento:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${discount.toFixed(2)}
            </Text>
          </Text>

          <Text style={{ color: colors.muted }}>
            Base:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${base.toFixed(2)}
            </Text>
          </Text>

          <Text style={{ color: colors.muted }}>
            IVA ({Math.round(taxRate * 100)}%):{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${tax.toFixed(2)}
            </Text>
          </Text>

          <Text style={{ color: colors.muted, marginTop: 4 }}>
            Total:{" "}
            <Text style={{ color: colors.accent, fontWeight: "900" }}>
              ${total.toFixed(2)}
            </Text>
          </Text>

          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Pagó:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${paid.toFixed(2)}
            </Text>
          </Text>

          <Text style={{ color: colors.muted }}>
            Cambio:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              ${change.toFixed(2)}
            </Text>
          </Text>
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="VER HISTORIAL"
            onPress={() => router.replace("/sales/sales-history" as any)}
            variant="secondary"
          />
          <AppButton
            title="IR A VENTAS"
            onPress={() => router.replace("/sales" as any)}
            variant="primary"
          />
        </View>
      </View>
    </Screen>
  );
}
