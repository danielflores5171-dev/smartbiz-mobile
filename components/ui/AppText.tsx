import React from "react";
import { Text, TextProps } from "react-native";
import { useTheme } from "../../context/theme-context";

export default function AppText(props: TextProps) {
  const { theme } = useTheme();

  return (
    <Text
      {...props}
      style={[{ color: theme === "dark" ? "#ffffff" : "#0f172a" }, props.style]}
    />
  );
}
