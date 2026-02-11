import React from "react";
import { Text, View } from "react-native";

export function KpiCard(props: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0b1220",
        borderWidth: 1,
        borderColor: "#1f2937",
        borderRadius: 16,
        padding: 14,
        gap: 6,
      }}
    >
      <Text style={{ color: "#94a3b8", fontSize: 12 }}>{props.title}</Text>
      <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>
        {props.value}
      </Text>
      {!!props.subtitle && (
        <Text style={{ color: "#64748b", fontSize: 12 }}>{props.subtitle}</Text>
      )}
    </View>
  );
}
