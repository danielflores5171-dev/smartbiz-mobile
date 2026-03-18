// app/(tabs)/sales/sales-history.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import ModuleStatusCard from "@/src/ui/ModuleStatusCard";
import Screen from "@/src/ui/Screen";

import { useAuthStore } from "@/src/store/authStore";
import { useBusinessStore } from "@/src/store/businessStore";
import { useInventoryStore } from "@/src/store/inventoryStore";
import { salesActions, useSalesStore } from "@/src/store/salesStore";
import type { ID } from "@/src/types/business";
import type { CartItem, Sale } from "@/src/types/sales";

function safeDate(input: unknown): Date | null {
  const d = input instanceof Date ? input : new Date(String(input ?? ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function safeFilename(name: string) {
  return String(name ?? "")
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 60);
}

async function writeAndShareFile(params: {
  filename: string;
  content: string;
  mimeType?: string;
}) {
  const { filename, content, mimeType } = params;

  try {
    const FileSystem = await import("expo-file-system");
    const Sharing = await import("expo-sharing");

    const dir =
      (FileSystem as any).documentDirectory ??
      (FileSystem as any).cacheDirectory;

    if (!dir) throw new Error("No directory available");

    const uri = dir + filename;

    await (FileSystem as any).writeAsStringAsync(uri, content, {
      encoding: (FileSystem as any).EncodingType?.UTF8 ?? "utf8",
    });

    if (
      (Sharing as any)?.isAvailableAsync &&
      (await (Sharing as any).isAvailableAsync())
    ) {
      await (Sharing as any).shareAsync(
        uri,
        mimeType ? { mimeType } : undefined,
      );
      return;
    }

    Alert.alert("Ticket exportado", `Archivo generado:\n${uri}`);
  } catch {
    Alert.alert(
      "Ticket",
      "No se pudo generar/compartir el archivo.\n\nContenido:\n\n" +
        content.slice(0, 1400) +
        (content.length > 1400 ? "\n\n...(recortado)" : ""),
    );
  }
}

function buildTicketText(params: { sale: Sale; businessName?: string | null }) {
  const { sale, businessName } = params;

  const created = safeDate(sale.createdAt);
  const subtotal = round2(Number(sale.subtotal ?? 0));
  const discount = round2(Number(sale.discount ?? 0));
  const base = round2(
    Number(sale.taxableBase ?? Math.max(0, subtotal - discount)),
  );
  const taxRate = Number(sale.taxRate ?? 0.16);
  const tax = round2(Number(sale.taxAmount ?? base * taxRate));
  const total = round2(Number(sale.total ?? base + tax));
  const paid = round2(Number(sale.paid ?? total));
  const change = round2(Number(sale.change ?? Math.max(0, paid - total)));
  const method = String(sale.paymentMethod ?? "—");

  const lines = ((sale.items ?? []) as CartItem[]).map((it) => {
    const qty = Number(it.qty ?? 0);
    const price = Number(it.price ?? 0);
    const lineTotal = round2(qty * price);
    const unit = String(it.unit ?? "").toUpperCase();

    return `- ${String(it.name ?? "Producto")} · ${qty} ${unit}\n  ${qty} x $${price.toFixed(2)} = $${lineTotal.toFixed(2)}`;
  });

  return [
    "SMARTBIZ - TICKET",
    `Negocio: ${businessName ?? "Negocio"}`,
    `Folio: ${String(sale.id)}`,
    `Fecha: ${created ? created.toLocaleString() : "Fecha inválida"}`,
    `Método de pago: ${method}`,
    sale.note ? `Nota: ${sale.note}` : "",
    "",
    "PRODUCTOS",
    lines.length > 0 ? lines.join("\n") : "(Sin conceptos)",
    "",
    "TOTALES",
    `Subtotal: $${subtotal.toFixed(2)}`,
    `Descuento: $${discount.toFixed(2)}`,
    `Base: $${base.toFixed(2)}`,
    `IVA (${Math.round(taxRate * 100)}%): $${tax.toFixed(2)}`,
    `Total: $${total.toFixed(2)}`,
    `Pagó: $${paid.toFixed(2)}`,
    `Cambio: $${change.toFixed(2)}`,
    "",
    "Modo demo/local: este ticket se genera localmente mientras no exista exportación real desde backend.",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function SalesHistory() {
  const router = useRouter();
  const { colors } = useTheme();

  const authUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const salesByBusiness = useSalesStore((s) => s.salesByBusiness);
  const sales = useMemo(() => {
    if (!activeBusinessId) return [] as Sale[];
    return salesByBusiness[String(activeBusinessId)] ?? [];
  }, [salesByBusiness, activeBusinessId]);

  const allProducts = useInventoryStore((s) => s.products);
  const productById = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of allProducts) map.set(String(p.id), p);
    return map;
  }, [allProducts]);

  useEffect(() => {
    if (!activeBusinessId) return;
    if (!authUser?.id) return;

    console.log(
      "[SalesHistory] load start userId=",
      authUser.id,
      "businessId=",
      activeBusinessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    void salesActions.bootstrap(authUser.id).then(() => {
      void salesActions.loadSales(activeBusinessId, token ?? undefined);
    });
  }, [activeBusinessId, authUser?.id, token]);

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
            onPress={() => router.replace("/(tabs)/sales" as any)}
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
              Ventas registradas.
            </Text>
          </View>

          <AppButton
            title="RECARGAR"
            onPress={() => {
              console.log(
                "[SalesHistory] manual reload businessId=",
                activeBusinessId,
              );
              void salesActions.loadSales(activeBusinessId, token ?? undefined);
            }}
            variant="secondary"
            fullWidth={false}
          />

          <AppButton
            title="CERRAR"
            onPress={() => router.replace("/(tabs)/sales" as any)}
            variant="secondary"
            fullWidth={false}
          />
        </View>

        <ModuleStatusCard
          connectedText="Consulta del historial, detalle individual y eliminación de ventas ya coinciden con la web; falta autorización Bearer/cookies para operar sobre backend real."
          demoText="La descarga del ticket se genera en local/demo como archivo TXT mientras no exista endpoint real de exportación/impresión desde backend."
        />

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
                          "¿Seguro que quieres eliminar esta venta del historial?",
                          [
                            { text: "Cancelar", style: "cancel" },
                            {
                              text: "Eliminar",
                              style: "destructive",
                              onPress: () => {
                                console.log(
                                  "[SalesHistory] delete saleId=",
                                  s.id,
                                  "businessId=",
                                  activeBusinessId,
                                );
                                void salesActions.deleteSale(
                                  activeBusinessId as ID,
                                  s.id as ID,
                                  token ?? undefined,
                                );
                              },
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
                          pathname: "/(tabs)/sales/sales-detail",
                          params: { id: String(s.id) },
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
                          "Modo demo: se generará un archivo TXT del ticket.",
                          [
                            {
                              text: "Descargar ticket",
                              onPress: async () => {
                                try {
                                  const content = buildTicketText({
                                    sale: s,
                                    businessName: activeBiz?.name ?? "Negocio",
                                  });

                                  const stamp = new Date()
                                    .toISOString()
                                    .slice(0, 19)
                                    .replace(/[:T]/g, "-");

                                  const bizName = safeFilename(
                                    activeBiz?.name ?? "negocio",
                                  );

                                  console.log(
                                    "[SalesHistory] ticket export local saleId=",
                                    s.id,
                                    "businessId=",
                                    activeBusinessId,
                                  );

                                  await writeAndShareFile({
                                    filename: `ticket_${bizName}_${String(s.id)}_${stamp}.txt`,
                                    content,
                                    mimeType: "text/plain",
                                  });
                                } catch (e: any) {
                                  Alert.alert(
                                    "Error",
                                    e?.message ??
                                      "No se pudo generar el ticket demo.",
                                  );
                                }
                              },
                            },
                            {
                              text: "Ver ticket",
                              onPress: () =>
                                router.push({
                                  pathname: "/(tabs)/sales/sales-detail",
                                  params: { id: String(s.id) },
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
