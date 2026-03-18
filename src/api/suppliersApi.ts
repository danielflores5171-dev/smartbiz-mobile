import { del, get, patch, post } from "./http";
import type { ID } from "./types";

export const suppliersApi = {
  list: (token: string, businessId: ID) =>
    get<{ items: any[] }>(`/api/business/${businessId}/suppliers`, { token }),

  create: (token: string, businessId: ID, body: any) =>
    post<{ item: any }>(`/api/business/${businessId}/suppliers`, body, {
      token,
    }),

  detail: (token: string, businessId: ID, supplierId: ID) =>
    get<{ item: any }>(`/api/business/${businessId}/suppliers/${supplierId}`, {
      token,
    }),

  update: (token: string, businessId: ID, supplierId: ID, body: any) =>
    patch<{ item: any }>(
      `/api/business/${businessId}/suppliers/${supplierId}`,
      body,
      { token },
    ),

  remove: (token: string, businessId: ID, supplierId: ID) =>
    del<{}>(`/api/business/${businessId}/suppliers/${supplierId}`, { token }),
};
