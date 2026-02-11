import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="landing-page" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="resend-code" />
      <Stack.Screen name="confirmation-token" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
