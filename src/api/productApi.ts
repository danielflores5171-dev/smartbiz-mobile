import { del, get, patch, post } from "./http";
import type { ApiProduct, ID } from "./types";

export const productApi = {
  list: (token: string) => get<{ items: ApiProduct[] }>("/api/product", token),
  create: (token: string, body: any) =>
    post<{ product: ApiProduct }>("/api/product", body, token),

  detail: (token: string, id: ID) =>
    get<{ product: ApiProduct }>(`/api/product/${id}`, token),
  update: (token: string, id: ID, body: any) =>
    patch<{ product: ApiProduct }>(`/api/product/${id}`, body, token),
  remove: (token: string, id: ID) => del<{}>(`/api/product/${id}`, token),

  stock: (token: string, id: ID, body: any) =>
    post<{ product: ApiProduct }>(`/api/product/${id}/stock`, body, token),
  movements: (token: string, id: ID) =>
    get<{ items: any[] }>(`/api/product/${id}/movements`, token),

  configGet: (token: string, id: ID) =>
    get<{ config: any }>(`/api/product/${id}/config`, token),
  configSet: (token: string, id: ID, body: any) =>
    post<{ config: any }>(`/api/product/${id}/config`, body, token),

  imagesList: (token: string, id: ID) =>
    get<{ items: any[] }>(`/api/product/${id}/images`, token),
  imagesAdd: (token: string, id: ID, body: any) =>
    post<{ image: any }>(`/api/product/${id}/images`, body, token),
  imagesRemove: (token: string, id: ID, imageId: ID) =>
    del<{}>(`/api/product/${id}/images/${imageId}`, token),
};
