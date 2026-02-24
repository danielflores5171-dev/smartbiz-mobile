import { Stack } from "expo-router";
import React from "react";

export default function InventoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Esto hace que /inventory apunte a /inventory/index */}
      <Stack.Screen name="index" />
    </Stack>
  );
}
