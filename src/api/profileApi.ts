// src/api/profileApi.ts
// TODO(web): cuando exista PATCH /api/me con Bearer token, este flujo dejará de caer a fallback demo.
import { apiRequest } from "@/src/lib/apiClient";

export type ApiProfileItem = {
  id: string;
  email: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  status?: string | null;
};

export const profileApi = {
  me: (token: string) =>
    apiRequest<{ user: ApiProfileItem | null }>("/api/me", {
      method: "GET",
      token,
    }),

  update: (
    token: string,
    body: {
      full_name?: string;
      email?: string;
      phone?: string | null;
      photo_url?: string | null;
    },
  ) =>
    apiRequest<{ user: ApiProfileItem | null }>("/api/me", {
      method: "PATCH",
      token,
      body,
    }),
};
