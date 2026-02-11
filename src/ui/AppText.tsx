// src/ui/AppText.tsx
import { useTheme } from "@/context/theme-context";
import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

type Variant = "title" | "subtitle" | "body" | "muted" | "label";

type Props = TextProps & {
  variant?: Variant;
  weight?: TextStyle["fontWeight"];
};

export default function AppText({
  variant = "body",
  weight,
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();

  const base: TextStyle =
    variant === "title"
      ? { color: colors.text, fontSize: 22, fontWeight: "900" }
      : variant === "subtitle"
        ? { color: colors.text, fontSize: 16, fontWeight: "800" }
        : variant === "label"
          ? { color: colors.muted, fontSize: 12, fontWeight: "800" }
          : variant === "muted"
            ? { color: colors.muted, fontSize: 14 }
            : { color: colors.text, fontSize: 14 };

  return (
    <Text
      {...rest}
      style={[base, weight ? { fontWeight: weight } : null, style]}
    />
  );
}
