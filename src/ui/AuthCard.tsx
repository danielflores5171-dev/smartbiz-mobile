// src/ui/AuthCard.tsx
import { useTheme } from "@/context/theme-context";
import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function AuthCard({ children, style }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          width: "100%",
          maxWidth: 520,
          alignSelf: "center",
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
