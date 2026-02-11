// src/ui/Screen.tsx
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/theme-context";

type Props = {
  children: React.ReactNode;
  padded?: boolean;
  scroll?: boolean;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function Screen({
  children,
  padded = true,
  scroll = false,
  center = false,
  style,
  contentStyle,
}: Props) {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.screenBg,
  };

  const innerStyle: ViewStyle = { flex: 1 };

  const contentContainer: ViewStyle = {
    flexGrow: 1,
    paddingHorizontal: padded ? 18 : 0,
    paddingTop: padded ? 18 : 0,
    paddingBottom: padded ? 24 : 0,
    justifyContent: center ? "center" : "flex-start",
  };

  const contentView: ViewStyle = {
    flex: 1,
    paddingHorizontal: padded ? 18 : 0,
    paddingTop: padded ? 18 : 0,
    paddingBottom: padded ? 24 : 0,
    justifyContent: center ? "center" : "flex-start",
    alignItems: center ? "center" : "stretch",
  };

  return (
    <LinearGradient colors={colors.gradient} style={[containerStyle, style]}>
      <SafeAreaView style={innerStyle}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[contentContainer, contentStyle]}
            style={
              Platform.OS === "android"
                ? { backgroundColor: "transparent" }
                : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[contentView, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
