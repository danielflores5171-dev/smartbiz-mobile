import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "smartbiz_token";
const BIZ_KEY = "smartbiz_active_business";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveActiveBusinessId(id: string) {
  await SecureStore.setItemAsync(BIZ_KEY, id);
}
export async function getActiveBusinessId() {
  return SecureStore.getItemAsync(BIZ_KEY);
}
export async function clearActiveBusinessId() {
  await SecureStore.deleteItemAsync(BIZ_KEY);
}
