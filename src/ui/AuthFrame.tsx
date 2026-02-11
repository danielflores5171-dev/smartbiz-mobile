// src/ui/AuthFrame.tsx
import { useTheme } from "@/context/theme-context";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  center?: boolean;
};

export default function AuthFrame({
  children,
  scroll = false,
  center = false,
}: Props) {
  const { colors } = useTheme();

  // “margen bonito” como tu captura del modo claro
  const INSET_Y = 22;
  const INSET_X = 18;

  const Header = () => (
    <View style={{ alignItems: "center", paddingTop: 2 }}>
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
        ☁ SmartBiz
      </Text>
      <Text
        style={{
          color: colors.muted,
          marginTop: 2,
          fontWeight: "700",
          fontSize: 12,
        }}
      >
        Tu acceso, inteligente
      </Text>
    </View>
  );

  const Footer = () => (
    <View style={{ alignItems: "center", paddingBottom: 2 }}>
      <Text style={{ color: colors.muted, fontSize: 12 }}>SmartBiz ☁ 2026</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.screenBg }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: INSET_X,
          paddingVertical: INSET_Y,
        }}
      >
        {/* ✅ Esto asegura que el header quede arriba y el footer abajo,
            pero NO “hasta el borde” por el paddingVertical */}
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <Header />

          {/* Contenido (centrado o scroll) */}
          {scroll ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: center ? "center" : "flex-start",
                alignItems: "center",
                paddingVertical: 12, // separa el card del header/footer
              }}
            >
              {children}
            </ScrollView>
          ) : (
            <View
              style={{
                flexGrow: 1,
                justifyContent: center ? "center" : "flex-start",
                alignItems: "center",
                paddingVertical: 12, // separa el card del header/footer
              }}
            >
              {children}
            </View>
          )}

          <Footer />
        </View>
      </View>
    </SafeAreaView>
  );
}
