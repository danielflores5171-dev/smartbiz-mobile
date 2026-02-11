// src/ui/StateView.tsx
import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import AppText from "@/src/ui/AppText";
import Card from "@/src/ui/Card";
import React from "react";
import { ActivityIndicator, View } from "react-native";

type Props =
  | { type: "loading"; title?: string }
  | {
      type: "empty";
      title: string;
      body?: string;
      actionTitle?: string;
      onAction?: () => void;
    }
  | {
      type: "error";
      title: string;
      body?: string;
      actionTitle?: string;
      onAction?: () => void;
    };

export default function StateView(props: Props) {
  const { colors } = useTheme();

  if (props.type === "loading") {
    return (
      <View style={{ paddingVertical: 18, alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <AppText variant="muted" style={{ marginTop: 10 }}>
          {props.title ?? "Cargando…"}
        </AppText>
      </View>
    );
  }

  return (
    <Card>
      <AppText variant="subtitle">{props.title}</AppText>
      {props.body ? (
        <AppText variant="muted" style={{ marginTop: 8 }}>
          {props.body}
        </AppText>
      ) : null}
      {props.actionTitle && props.onAction ? (
        <View style={{ marginTop: 14 }}>
          <AppButton
            title={props.actionTitle}
            onPress={props.onAction}
            variant="secondary"
          />
        </View>
      ) : null}
    </Card>
  );
}
