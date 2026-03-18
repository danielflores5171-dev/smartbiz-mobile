// src/api/businessApi.ts
import { del, get, patch, post } from "./http";
import type { ID } from "./types";

type ApiBusinessItem = {
  id: string;
  name: string;
  is_owner?: boolean;
  is_admin?: boolean;
  role?: string;
};

export const businessApi = {
  list: (token: string) =>
    get<{ items: ApiBusinessItem[] }>("/api/business", { token }),

  // web: POST /api/business -> { item }
  create: (token: string, body: { name: string }) =>
    post<{ item: ApiBusinessItem }>(
      "/api/business",
      { name: body.name },
      { token },
    ),

  detail: (token: string, businessId: ID) =>
    get<{ business: any }>(`/api/business/${businessId}`, { token }),

  update: (token: string, businessId: ID, body: { name: string }) =>
    patch<{ business: any }>(
      `/api/business/${businessId}`,
      { name: body.name },
      { token },
    ),

  remove: (token: string, businessId: ID) =>
    del<{}>(`/api/business/${businessId}`, { token }),
};

// ❌ elimina businessApi.active (no existe endpoint en la web)
