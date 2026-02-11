// src/ui/Divider.tsx
import { useTheme } from "@/context/theme-context";
import React from "react";
import { View, type ViewProps } from "react-native";

type Props = ViewProps & {
  spacing?: number;
};

export default function Divider({ spacing = 14, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View
      {...rest}
      style={[
        { height: 1, backgroundColor: colors.divider, marginVertical: spacing },
        style,
      ]}
    />
  );
}
