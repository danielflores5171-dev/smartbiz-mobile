import React from "react";
import { View } from "react-native";
import { useTheme } from "../context/theme-context";

export default function Screen({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
      }}
    >
      {children}
    </View>
  );
}
