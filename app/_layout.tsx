// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-gesture-handler";

import { ThemeProvider, useTheme } from "@/context/theme-context";

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      <ThemedStatusBar />
    </ThemeProvider>
  );
}
