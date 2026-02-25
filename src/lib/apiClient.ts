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

// ✅ Log baseURL una sola vez (para diagnosticar)
let loggedEnv = false;

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const rawBase = String(ENV.API_BASE_URL ?? "");
  const base = rawBase.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!loggedEnv) {
    loggedEnv = true;
    console.log("[env] API_BASE_URL =", base);
  }

  if (!base) {
    // Esto evita el “Invalid URL: /api/...”
    throw new Error(
      "API_BASE_URL vacío. Revisa EXPO_PUBLIC_API_BASE_URL en tu .env y reinicia con `npx expo start -c`.",
    );
  }

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
  if (opts.businessId) headers["X-Business-Id"] = String(opts.businessId);

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  // Si el backend regresara HTML (redirect), evitamos crashear feo
  const text = await res.text();
  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error(`Respuesta no-JSON (${res.status}): ${text.slice(0, 120)}`);
  }

  if (!json.ok) {
    const msg = `${json.error.code}: ${json.error.message}`;
    throw new Error(msg);
  }

  return json;
}
