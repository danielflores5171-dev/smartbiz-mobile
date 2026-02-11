// app/(tabs)/sales/ticket.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import { useSalesStore } from "@/src/store/salesStore";
import type { CartItem, Sale } from "@/src/types/sales";

function normalizeParamId(id: string | string[] | undefined): string {
  if (!id) return "";
  return Array.isArray(id) ? (id[0] ?? "") : id;
}

function safeDate(input: unknown): Date | null {
  const d = input instanceof Date ? input : new Date(String(input ?? ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function TicketScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = normalizeParamId(params.id);

  const { colors } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);

  const biz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const sale = useSalesStore((s) => {
    if (!activeBusinessId || !id) return null;
    const list = (s.salesByBusiness?.[String(activeBusinessId)] ??
      []) as Sale[];
    return list.find((x: Sale) => String(x.id) === String(id)) ?? null;
  });

  const dateStr = useMemo(() => {
    const d = safeDate(sale?.createdAt);
    return d ? d.toLocaleString() : "Fecha inválida";
  }, [sale?.createdAt]);

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

  if (!sale) {
    return (
      <Screen center padded>
        <Text style={{ color: colors.text, fontWeight: "900" }}>
          Ticket no encontrado.
        </Text>
        <View style={{ marginTop: 12 }}>
          <AppButton
            title="IR A HISTORIAL"
            onPress={() => router.replace("/sales/sales-history" as any)}
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
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
          Ticket
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>{dateStr}</Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text style={{ color: colors.text, fontWeight: "900" }}>
          {biz?.name ?? "SmartBiz"}
        </Text>
        {biz?.phone ? (
          <Text style={{ color: colors.muted, marginTop: 4 }}>
            Tel: {biz.phone}
          </Text>
        ) : null}
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Folio: {String(sale.id)}
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        {(sale.items ?? []).map((it: CartItem) => (
          <View key={String(it.productId)} style={{ marginBottom: 10 }}>
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {it.name}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 2, fontSize: 12 }}>
              {Number(it.qty ?? 0)} x ${Number(it.price ?? 0).toFixed(2)} (
              {String(it.unit ?? "")}) ={" "}
              <Text style={{ color: colors.accent, fontWeight: "900" }}>
                ${(Number(it.qty ?? 0) * Number(it.price ?? 0)).toFixed(2)}
              </Text>
            </Text>
          </View>
        ))}

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
            ${Number(sale.subtotal ?? 0).toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted }}>
          Descuento:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${Number(sale.discount ?? 0).toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted }}>
          Base:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${Number(sale.taxableBase ?? 0).toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted }}>
          IVA ({Math.round(Number(sale.taxRate ?? 0) * 100)}%):{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${Number(sale.taxAmount ?? 0).toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Total:{" "}
          <Text style={{ color: colors.accent, fontWeight: "900" }}>
            ${Number(sale.total ?? 0).toFixed(2)}
          </Text>
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 16,
          }}
        />

        <Text style={{ color: colors.muted }}>
          Pagó:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${Number(sale.paid ?? 0).toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted }}>
          Cambio:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${Number(sale.change ?? 0).toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Método:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {String(sale.paymentMethod ?? "")}
          </Text>
        </Text>

        {sale.note ? (
          <Text style={{ color: colors.muted, marginTop: 10 }}>
            Nota: {sale.note}
          </Text>
        ) : null}

        <View style={{ marginTop: 16, gap: 10 }}>
          <AppButton
            title="VER HISTORIAL"
            onPress={() => router.replace("/sales/sales-history" as any)}
            variant="secondary"
          />
          <AppButton
            title="NUEVA VENTA"
            onPress={() => router.replace("/sales" as any)}
            variant="primary"
          />
        </View>
      </View>
    </Screen>
  );
}
