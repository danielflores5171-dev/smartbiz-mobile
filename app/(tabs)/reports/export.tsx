import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import { useBusinessStore } from "@/src/store/businessStore";
import {
  inventoryActions,
  useInventoryStore,
} from "@/src/store/inventoryStore";
import { useSalesStore } from "@/src/store/salesStore";

type ExportKind = "csv" | "txt" | "pdf" | "docx" | "xlsx";

const KINDS: { kind: ExportKind; label: string; icon: any; hint: string }[] = [
  {
    kind: "pdf",
    label: "PDF",
    icon: "document-text-outline",
    hint: "Demo (placeholder)",
  },
  {
    kind: "docx",
    label: "Word (DOCX)",
    icon: "document-outline",
    hint: "Demo (placeholder)",
  },
  {
    kind: "xlsx",
    label: "Excel (XLSX)",
    icon: "grid-outline",
    hint: "Demo (placeholder)",
  },
  { kind: "csv", label: "CSV", icon: "list-outline", hint: "Real (texto)" },
  {
    kind: "txt",
    label: "TXT",
    icon: "code-slash-outline",
    hint: "Real (texto)",
  },
];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function safeFilename(name: string) {
  return String(name ?? "")
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 60);
}

function safeTime(v: unknown) {
  const t = new Date(String(v ?? "")).getTime();
  return Number.isFinite(t) ? t : 0;
}

function toCSV(rows: Array<Record<string, any>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.map(esc).join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ];
  return lines.join("\n");
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

    Alert.alert("Exportado", `Archivo generado:\n${uri}`);
  } catch {
    Alert.alert(
      "Export (demo)",
      "No se pudo generar/compartir el archivo.\n\nContenido (copia/pega):\n\n" +
        content.slice(0, 1400) +
        (content.length > 1400 ? "\n\n...(recortado)" : ""),
    );
  }
}

export default function ReportsExport() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);
  const activeBiz = useBusinessStore(
    (s) => s.businesses.find((b) => b.id === s.activeBusinessId) ?? null,
  );

  const allProducts = useInventoryStore((s) => s.products ?? []);
  const allAdjustments = useInventoryStore((s) => s.adjustments ?? []);

  const salesByBusiness = useSalesStore((s) => s.salesByBusiness ?? {});
  const allSalesForBiz = useMemo(() => {
    if (!activeBusinessId) return [];
    return salesByBusiness[String(activeBusinessId)] ?? [];
  }, [salesByBusiness, activeBusinessId]);

  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [kind, setKind] = useState<ExportKind>("csv");

  useEffect(() => {
    void inventoryActions.bootstrap().then(() => {
      if (activeBusinessId)
        void inventoryActions.loadProducts(activeBusinessId);
    });
  }, [activeBusinessId]);

  const cutoff = useMemo(() => Date.now() - days * 24 * 60 * 60 * 1000, [days]);

  const products = useMemo(() => {
    if (!activeBusinessId) return [];
    return allProducts.filter((p: any) => p.businessId === activeBusinessId);
  }, [allProducts, activeBusinessId]);

  const lowStock = useMemo(() => {
    return products.filter(
      (p: any) => p.minStock != null && p.stock <= (p.minStock ?? 0),
    );
  }, [products]);

  const adjustments = useMemo(() => {
    if (!activeBusinessId) return [];
    return allAdjustments
      .filter((a: any) => a.businessId === activeBusinessId)
      .filter((a: any) => safeTime(a.createdAt) >= cutoff);
  }, [allAdjustments, activeBusinessId, cutoff]);

  const sales = useMemo(() => {
    return allSalesForBiz.filter((s: any) => safeTime(s.createdAt) >= cutoff);
  }, [allSalesForBiz, cutoff]);

  const totals = useMemo(() => {
    const gross = round2(
      sales.reduce((acc: number, s: any) => acc + (s.total ?? 0), 0),
    );
    const subtotal = round2(
      sales.reduce((acc: number, s: any) => acc + (s.subtotal ?? 0), 0),
    );
    const discount = round2(
      sales.reduce((acc: number, s: any) => acc + (s.discount ?? 0), 0),
    );
    const tax = round2(
      sales.reduce((acc: number, s: any) => acc + (s.taxAmount ?? 0), 0),
    );
    const count = sales.length;
    return { gross, subtotal, discount, tax, count };
  }, [sales]);

  const exportPayload = useMemo(() => {
    const salesRows = sales.map((s: any) => ({
      saleId: s.id,
      createdAt: s.createdAt,
      paymentMethod: s.paymentMethod,
      subtotal: s.subtotal,
      discount: s.discount,
      taxableBase: s.taxableBase,
      taxRate: s.taxRate,
      taxAmount: s.taxAmount,
      total: s.total,
      paid: s.paid,
      change: s.change,
      note: s.note ?? "",
      itemsCount: (s.items ?? []).length,
    }));

    const invRows = products.map((p: any) => ({
      productId: p.id,
      name: p.name,
      unit: p.unit,
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      minStock: p.minStock ?? "",
      status: p.status,
      updatedAt: p.updatedAt,
    }));

    const adjRows = adjustments.map((a: any) => ({
      adjustmentId: a.id,
      createdAt: a.createdAt,
      productId: a.productId,
      delta: a.delta,
      reason: a.reason,
      note: a.note ?? "",
    }));

    return { salesRows, invRows, adjRows };
  }, [sales, products, adjustments]);

  const prettySummary = useMemo(() => {
    const bizName = activeBiz?.name ?? "Negocio";
    return [
      `SMARTBIZ - REPORTE (DEMO)`,
      `Negocio: ${bizName}`,
      `Periodo: últimos ${days} días`,
      `Generado: ${new Date().toLocaleString()}`,
      ``,
      `RESUMEN`,
      `- Ventas: ${totals.count}`,
      `- Subtotal: $${totals.subtotal.toFixed(2)}`,
      `- Descuento: $${totals.discount.toFixed(2)}`,
      `- IVA: $${totals.tax.toFixed(2)}`,
      `- Total: $${totals.gross.toFixed(2)}`,
      ``,
      `INVENTARIO`,
      `- Productos: ${products.length}`,
      `- Bajo stock: ${lowStock.length}`,
      ``,
      `MOVIMIENTOS INVENTARIO (periodo)`,
      `- Ajustes: ${adjustments.length}`,
      ``,
      `NOTA: PDF/DOCX/XLSX aún es placeholder. Luego lo hacemos real.`,
    ].join("\n");
  }, [
    activeBiz?.name,
    days,
    totals,
    products.length,
    lowStock.length,
    adjustments.length,
  ]);

  const Pill = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: active ? colors.pillBgActive : colors.pillBg,
      }}
    >
      <Ionicons
        name="calendar-outline"
        size={16}
        color={active ? "#93c5fd" : colors.muted}
      />
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}>
        {label}
      </Text>
    </Pressable>
  );

  const KindCard = ({
    k,
    active,
    onPress,
  }: {
    k: (typeof KINDS)[number];
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 150,
        backgroundColor: active ? colors.accentSoft : colors.card,
        borderWidth: 1,
        borderColor: active ? colors.inputBorderEmphasis : colors.border,
        borderRadius: 18,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name={k.icon} size={18} color={colors.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {k.label}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
            {k.hint}
          </Text>
        </View>

        {active ? (
          <Ionicons name="checkmark-circle" size={18} color="#93c5fd" />
        ) : null}
      </View>
    </Pressable>
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
            onPress={() => router.replace("/(tabs)/business" as any)}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  const doExport = async () => {
    const bizName = safeFilename(activeBiz?.name ?? "negocio");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    if (kind === "csv") {
      const salesCSV = toCSV(exportPayload.salesRows);
      const invCSV = toCSV(exportPayload.invRows);
      const adjCSV = toCSV(exportPayload.adjRows);

      const content = [
        "# SMARTBIZ REPORT (CSV DEMO)",
        `# business=${bizName}`,
        `# period_days=${days}`,
        `# generated=${new Date().toISOString()}`,
        "",
        "## SALES",
        salesCSV || "saleId,createdAt,...(sin ventas)",
        "",
        "## INVENTORY",
        invCSV || "productId,name,...(sin productos)",
        "",
        "## INVENTORY_ADJUSTMENTS",
        adjCSV || "adjustmentId,createdAt,...(sin movimientos)",
        "",
      ].join("\n");

      await writeAndShareFile({
        filename: `smartbiz_report_${bizName}_${stamp}.csv`,
        content,
        mimeType: "text/csv",
      });
      return;
    }

    if (kind === "txt") {
      const json = JSON.stringify(
        {
          business: { id: activeBusinessId, name: activeBiz?.name ?? "" },
          periodDays: days,
          generatedAt: new Date().toISOString(),
          summary: totals,
          lowStockCount: lowStock.length,
          counts: {
            products: products.length,
            adjustments: adjustments.length,
            sales: sales.length,
          },
          lastSales: sales.slice(0, 5).map((s: any) => ({
            id: s.id,
            total: s.total,
            createdAt: s.createdAt,
          })),
        },
        null,
        2,
      );

      const content = `${prettySummary}\n\n---\n\nJSON (demo)\n${json}\n`;
      await writeAndShareFile({
        filename: `smartbiz_report_${bizName}_${stamp}.txt`,
        content,
        mimeType: "text/plain",
      });
      return;
    }

    const placeholder =
      `${prettySummary}\n\n(PLACEHOLDER ${kind.toUpperCase()})\n\n` +
      `Luego conectamos generadores reales:\n- PDF: pdf-lib / pdfmake / backend\n- DOCX: docx (JS) / backend\n- XLSX: xlsx + FileSystem\n`;

    await writeAndShareFile({
      filename: `smartbiz_report_${bizName}_${stamp}.${kind}`,
      content: placeholder,
    });
  };

  return (
    <Screen scroll padded>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900" }}>
        Exportar reportes
      </Text>
      <Text style={{ color: colors.muted, marginTop: 6 }}>
        Exporta datos del negocio activo (demo). CSV/TXT son reales;
        PDF/DOCX/XLSX son placeholder.
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 14,
        }}
      >
        <Pill
          label="Últimos 7 días"
          active={days === 7}
          onPress={() => setDays(7)}
        />
        <Pill
          label="Últimos 30 días"
          active={days === 30}
          onPress={() => setDays(30)}
        />
        <Pill
          label="Últimos 90 días"
          active={days === 90}
          onPress={() => setDays(90)}
        />
      </View>

      <View
        style={{
          marginTop: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          Resumen del periodo
        </Text>
        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <Text style={{ color: colors.muted }}>
          Ventas:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {totals.count}
          </Text>
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Total:{" "}
          <Text style={{ color: "#93c5fd", fontWeight: "900" }}>
            ${totals.gross.toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          IVA:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            ${totals.tax.toFixed(2)}
          </Text>
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Productos:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {products.length}
          </Text>
          {" · "}Bajo stock:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {lowStock.length}
          </Text>
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Movimientos inventario:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {adjustments.length}
          </Text>
        </Text>
      </View>

      <View
        style={{
          marginTop: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
          Formato de exportación
        </Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>
          Elige el formato. CSV/TXT son reales; los demás son demo por ahora.
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: 14,
          }}
        />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {KINDS.map((k) => (
            <KindCard
              key={k.kind}
              k={k}
              active={kind === k.kind}
              onPress={() => setKind(k.kind)}
            />
          ))}
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          <AppButton title="EXPORTAR" onPress={doExport} variant="primary" />
          <AppButton
            title="VOLVER A REPORTES"
            onPress={() => router.replace("/(tabs)/reports" as any)}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
}
