import { get, post } from "./http";
import type { ApiUser } from "./types";

export const authApi = {
  ping: () => get<{ pong: boolean }>("/api/public/ping"),
  me: (token: string) => get<{ user: ApiUser }>("/api/auth/me", token),

  // si luego quieres usar login/logout del backend en vez de supabase directo:
  login: (body: { email: string; password: string }) =>
    post<{ token: string; user: ApiUser }>("/api/auth/login", body),
  logout: (token: string) => post<{}>("/api/auth/logout", {}, token),
};
