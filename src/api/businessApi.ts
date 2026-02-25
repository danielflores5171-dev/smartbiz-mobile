import { del, get, patch, post } from "./http";
import type { ApiBusiness, ID } from "./types";

export const businessApi = {
  list: (token: string) =>
    get<{ items: ApiBusiness[] }>("/api/business", token),
  create: (token: string, body: any) =>
    post<{ business: ApiBusiness }>("/api/business", body, token),

  active: (token: string) =>
    get<{ business: ApiBusiness | null }>("/api/business/active", token),

  detail: (token: string, businessId: ID) =>
    get<{ business: ApiBusiness }>(`/api/business/${businessId}`, token),

  update: (token: string, businessId: ID, body: any) =>
    patch<{ business: ApiBusiness }>(
      `/api/business/${businessId}`,
      body,
      token,
    ),

  remove: (token: string, businessId: ID) =>
    del<{}>(`/api/business/${businessId}`, token),
};
