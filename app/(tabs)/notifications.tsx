// app/(tabs)/notifications.tsx
import { Redirect } from "expo-router";
import React from "react";

export default function NotificationsBridge() {
  // Puente: existe dentro de (tabs) para que el Drawer no marque WARN,
  // pero manda a la pantalla real que está fuera de (tabs).
  return <Redirect href="/notifications" />;
}
