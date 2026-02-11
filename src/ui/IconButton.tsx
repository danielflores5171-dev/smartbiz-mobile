// src/ui/IconButton.tsx
import { useTheme } from "@/context/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, type PressableProps, type ViewStyle } from "react-native";

type Props = PressableProps & {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  variant?: "card" | "ghost";
};

export default function IconButton({
  icon,
  size = 18,
  variant = "card",
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();

  const base = useMemo<ViewStyle>(() => {
    return {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: variant === "card" ? colors.card : "transparent",
    };
  }, [colors, variant]);

  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        base,
        pressed ? { opacity: 0.9, transform: [{ scale: 0.99 }] } : null,
        style as any,
      ]}
    >
      <Ionicons name={icon} size={size} color={colors.icon} />
    </Pressable>
  );
}
