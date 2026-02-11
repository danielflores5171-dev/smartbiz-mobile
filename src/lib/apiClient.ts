import { ENV } from "./env";

export type ApiError = {
  ok: false;
  error: { code: string; message: string; details?: any; traceId?: string };
};

export type ApiOk<T> = { ok: true; data: T; meta?: any };

type ApiResponse<T> = ApiOk<T> | ApiError;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string | null;
  businessId?: string | null;
  body?: any;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = ENV.API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(base + cleanPath);

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<ApiOk<T>> {
  const url = buildUrl(path, opts.query);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.businessId) headers["X-Business-Id"] = opts.businessId; // multi-tenant:contentReference[oaicite:4]{index=4}

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.ok) {
    // Error estándar del contrato:contentReference[oaicite:5]{index=5}
    const msg = `${json.error.code}: ${json.error.message}`;
    throw new Error(msg);
  }

  return json;
}
