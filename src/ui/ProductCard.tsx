// src/ui/ProductCard.tsx
import { useTheme } from "@/context/theme-context";
import React, { useMemo } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  unit?: string | null;
  price?: number | null;
  stock?: number | null;
};

type Props = {
  product: Product;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function ProductCard({ product, onPress, style }: Props) {
  const { colors } = useTheme();

  const stock = Number(product.stock ?? 0);
  const price = Number(product.price ?? 0);

  const meta = useMemo(() => {
    const parts: string[] = [];
    if (product.sku) parts.push(`SKU: ${product.sku}`);
    if (product.barcode) parts.push(`CB: ${product.barcode}`);
    if (product.unit) parts.push(String(product.unit).toUpperCase());
    return parts.join(" · ");
  }, [product.sku, product.barcode, product.unit]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.card2,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          padding: 14,
          opacity: pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            numberOfLines={1}
            style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}
          >
            {product.name}
          </Text>

          {meta ? (
            <Text
              numberOfLines={1}
              style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}
            >
              {meta}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Stock:{" "}
            <Text style={{ color: colors.accent, fontWeight: "900" }}>
              {stock}
            </Text>
          </Text>

          {Number.isFinite(price) ? (
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
              ${price.toFixed(2)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
