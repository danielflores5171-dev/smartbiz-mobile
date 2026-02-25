// src/lib/env.ts
function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    console.warn(`[env] Missing ${name}`);
    return "";
  }
  return value;
}

export const ENV = {
  API_BASE_URL: requireEnv(
    "EXPO_PUBLIC_API_BASE_URL",
    process.env.EXPO_PUBLIC_API_BASE_URL,
  ),
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
};
