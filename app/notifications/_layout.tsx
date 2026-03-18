// app/(tabs)/notifications/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function NotificationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
