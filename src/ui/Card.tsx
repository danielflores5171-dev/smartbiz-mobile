import { useTheme } from "@/context/theme-context";
import React from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";

type Props = ViewProps & {
  variant?: "card" | "card2";
  padded?: boolean;
  radius?: number;
};

export default function Card({
  variant = "card",
  padded = true,
  radius = 18,
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();

  const base: ViewStyle = {
    backgroundColor: variant === "card" ? colors.card : colors.card2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    padding: padded ? 14 : 0,
  };

  return <View {...rest} style={[base, style]} />;
}
