// src/ui/AppInput.tsx
import { useTheme } from "@/context/theme-context";
import React, { useMemo, useState } from "react";
import {
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

type Props = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  emphasis?: boolean;
};

export default function AppInput({
  label,
  containerStyle,
  style,
  emphasis = false,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = useMemo(() => {
    // ✅ En foco: resalta siempre con inputBorderEmphasis (modo normal/light/dark)
    if (focused) return colors.inputBorderEmphasis;
    // ✅ Fuera de foco: si emphasis, también puede mantenerse “un poco más pro”
    // (pero SIN gritar). Puedes dejarlo igual a colors.border si quieres más neutral.
    return colors.border;
  }, [focused, colors.inputBorderEmphasis, colors.border]);

  return (
    <View style={[{ marginTop: 12 }, containerStyle]}>
      {label ? (
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            marginBottom: 6,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
      ) : null}

      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            backgroundColor: emphasis ? colors.inputBgEmphasis : colors.inputBg,
            borderWidth: 1,
            borderColor,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
      />
    </View>
  );
}
