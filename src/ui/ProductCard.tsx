// src/ui/ProductCard.tsx
import { useTheme } from "@/context/theme-context";
import React, { useMemo } from "react";
import { Image, Pressable, Text, View, type ViewStyle } from "react-native";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  unit?: string | null;
  price?: number | null;
  stock?: number | null;
  imageUri?: string | null;
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* ✅ miniatura */}
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {product.imageUri ? (
            <Image
              source={{ uri: product.imageUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ color: colors.muted, fontSize: 10 }}>Sin foto</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
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

          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
            Stock:{" "}
            <Text style={{ color: colors.accent, fontWeight: "900" }}>
              {stock}
            </Text>
            {Number.isFinite(price) ? (
              <>
                {"  "}· ${price.toFixed(2)}
              </>
            ) : null}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
