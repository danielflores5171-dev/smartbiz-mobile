// src/api/http.ts
import { apiRequest } from "@/src/lib/apiClient";

export type Token = string;

export function get<T>(path: string, token?: Token) {
  return apiRequest<T>(path, { method: "GET", token });
}

export function post<T>(path: string, body: any, token?: Token) {
  return apiRequest<T>(path, { method: "POST", body, token });
}

export function put<T>(path: string, body: any, token?: Token) {
  return apiRequest<T>(path, { method: "PUT", body, token });
}

export function patch<T>(path: string, body: any, token?: Token) {
  return apiRequest<T>(path, { method: "PATCH", body, token });
}

export function del<T>(path: string, token?: Token) {
  return apiRequest<T>(path, { method: "DELETE", token });
}
