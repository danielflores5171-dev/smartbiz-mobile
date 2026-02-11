// src/ui/AppButton.tsx
import { useTheme } from "@/context/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableStateCallbackType,
  type StyleProp,
  Text,
  type TextStyle,
  type ViewStyle,
} from "react-native";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = {
  title: string;
  onPress?: () => void | Promise<void>;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loading?: boolean;
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  fullWidth = true,
  leftIcon,
  style,
  textStyle,
  loading = false,
}: Props) {
  const { colors } = useTheme();

  const styles = useMemo(() => {
    const base: ViewStyle = {
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      borderWidth: 1,
    };

    const full: ViewStyle = fullWidth ? { width: "100%" } : {};

    const primary: ViewStyle = {
      backgroundColor: colors.buttonPrimaryBg,
      borderColor: colors.border,
    };

    const secondary: ViewStyle = {
      backgroundColor: colors.buttonSecondaryBg,
      borderColor: colors.buttonSecondaryBorder,
    };

    const danger: ViewStyle = {
      backgroundColor: colors.semantic.dangerSolidBg,
      borderColor: colors.semantic.dangerSolidBg,
    };

    const ghost: ViewStyle = {
      backgroundColor: "transparent",
      borderColor: colors.buttonGhostBorder,
    };

    const labelByVariant: Record<Variant, string> = {
      primary: colors.buttonPrimaryText,
      secondary: colors.buttonSecondaryText,
      ghost: colors.buttonGhostText,
      danger: colors.semantic.dangerSolidText,
    };

    const pressedBg: Record<Variant, string> = {
      primary: colors.buttonPrimaryBgPressed,
      secondary: colors.buttonSecondaryBgPressed,
      ghost: colors.buttonGhostBgPressed,
      danger: colors.semantic.dangerSolidBgPressed,
    };

    const label: TextStyle = {
      color: labelByVariant[variant],
      fontWeight: "900",
      fontSize: 12,
      letterSpacing: 0.6,
    };

    const iconColor = labelByVariant[variant];

    const disabledStyle: ViewStyle = { opacity: 0.55 };

    const variantStyle: ViewStyle =
      variant === "primary"
        ? primary
        : variant === "danger"
          ? danger
          : variant === "ghost"
            ? ghost
            : secondary;

    return {
      base,
      full,
      variantStyle,
      label,
      iconColor,
      pressedBg,
      disabledStyle,
    };
  }, [colors, fullWidth, variant]);

  const isDisabled = disabled || loading;

  const pressableStyle = ({ pressed }: PressableStateCallbackType) => {
    const pressedStyle: ViewStyle | undefined =
      pressed && !isDisabled
        ? {
            backgroundColor: styles.pressedBg[variant],
            transform: [{ scale: 0.99 }],
          }
        : undefined;

    return [
      styles.base,
      styles.full,
      styles.variantStyle,
      isDisabled ? styles.disabledStyle : undefined,
      pressedStyle,
      style,
    ];
  };

  return (
    <Pressable
      onPress={() => !isDisabled && void onPress?.()}
      disabled={isDisabled}
      style={pressableStyle}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.iconColor} />
      ) : leftIcon ? (
        <Ionicons name={leftIcon} size={18} color={styles.iconColor} />
      ) : null}

      <Text style={[styles.label, textStyle]}>{title}</Text>
    </Pressable>
  );
}
