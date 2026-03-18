// app/(tabs)/sales/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function SalesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="sales-history" />
      <Stack.Screen name="sales-detail" />
    </Stack>
  );
}
