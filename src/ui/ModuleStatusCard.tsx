import React from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";

type Props = {
  title?: string;
  connectedText: string;
  demoText: string;
};

function Dot({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 99,
        backgroundColor: color,
        marginTop: 4,
      }}
    />
  );
}

export default function ModuleStatusCard({
  title = "Estado del módulo",
  connectedText,
  demoText,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        marginTop: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 14,
      }}
    >
      <Text style={{ color: colors.text, fontWeight: "900", fontSize: 15 }}>
        {title}
      </Text>

      <View
        style={{
          height: 1,
          backgroundColor: colors.divider,
          marginVertical: 12,
        }}
      />

      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <Dot color="#22c55e" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 13 }}>
            Conectado con web · falta autorización
          </Text>
          <Text
            style={{
              color: colors.muted,
              marginTop: 4,
              lineHeight: 18,
              fontSize: 12,
            }}
          >
            {connectedText}
          </Text>
        </View>
      </View>

      <View style={{ height: 10 }} />

      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <Dot color="#f59e0b" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 13 }}>
            Local/demo · se añadirá en próximas actualizaciones
          </Text>
          <Text
            style={{
              color: colors.muted,
              marginTop: 4,
              lineHeight: 18,
              fontSize: 12,
            }}
          >
            {demoText}
          </Text>
        </View>
      </View>
    </View>
  );
}
