import { del, get, patch, post } from "./http";
import type { ID } from "./types";

export const employeesApi = {
  list: (token: string, businessId: ID) =>
    get<{ items: any[] }>(`/api/business/${businessId}/employees`, { token }),

  create: (token: string, businessId: ID, body: any) =>
    post<{ item: any }>(`/api/business/${businessId}/employees`, body, {
      token,
    }),

  detail: (token: string, businessId: ID, memberId: ID) =>
    get<{ item: any }>(`/api/business/${businessId}/employees/${memberId}`, {
      token,
    }),

  update: (token: string, businessId: ID, memberId: ID, body: any) =>
    patch<{ item: any }>(
      `/api/business/${businessId}/employees/${memberId}`,
      body,
      { token },
    ),

  remove: (token: string, businessId: ID, memberId: ID) =>
    del<{}>(`/api/business/${businessId}/employees/${memberId}`, { token }),
};
