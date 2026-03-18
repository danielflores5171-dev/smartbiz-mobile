// src/api/http.ts
import { apiRequest } from "@/src/lib/apiClient";

export type Token = string;

type Opts = {
  token?: Token;
  businessId?: string | null;
  query?: Record<string, string | number | boolean | undefined | null>;
};

export function get<T>(path: string, opts: Opts = {}) {
  return apiRequest<T>(path, {
    method: "GET",
    token: opts.token,
    businessId: opts.businessId ?? undefined,
    query: opts.query,
  });
}

export function post<T>(path: string, body: any, opts: Opts = {}) {
  return apiRequest<T>(path, {
    method: "POST",
    token: opts.token,
    businessId: opts.businessId ?? undefined,
    body,
  });
}

export function put<T>(path: string, body: any, opts: Opts = {}) {
  return apiRequest<T>(path, {
    method: "PUT",
    token: opts.token,
    businessId: opts.businessId ?? undefined,
    body,
  });
}

export function patch<T>(path: string, body: any, opts: Opts = {}) {
  return apiRequest<T>(path, {
    method: "PATCH",
    token: opts.token,
    businessId: opts.businessId ?? undefined,
    body,
  });
}

export function del<T>(path: string, opts: Opts = {}) {
  return apiRequest<T>(path, {
    method: "DELETE",
    token: opts.token,
    businessId: opts.businessId ?? undefined,
  });
}
