import { get, post } from "./http";
import type { ApiSale, ID } from "./types";

export const salesApi = {
  list: (token: string) => get<{ items: ApiSale[] }>("/api/sales", token),
  summary: (token: string) =>
    get<{ summary: any }>("/api/sales/summary", token),
  detail: (token: string, saleId: ID) =>
    get<{ sale: ApiSale }>(`/api/sales/${saleId}`, token),
  create: (token: string, body: any) =>
    post<{ sale: ApiSale }>("/api/sales", body, token),
};
