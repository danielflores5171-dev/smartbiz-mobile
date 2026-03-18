import { apiRequest } from "@/src/lib/apiClient";

export type SupportContext = {
  module?: string;
  screen?: string;
  user?: {
    id?: string | null;
    email?: string | null;
    full_name?: string | null;
  } | null;
  business?: {
    id?: string | null;
    name?: string | null;
  } | null;
  app?: {
    platform?: string | null;
    source?: string | null;
  } | null;
  extra?: Record<string, unknown> | null;
};

export type SupportPayload = {
  subject: string;
  message: string;
  context?: SupportContext;
};

export const supportApi = {
  async send(token: string, body: SupportPayload) {
    try {
      console.log(
        "[supportApi.send] CALL tokenHead=",
        String(token ?? "").slice(0, 10),
      );

      const res = await apiRequest<{ ok?: boolean; ticketId?: string }>(
        "/api/support",
        {
          method: "POST",
          token,
          body,
        },
      );

      console.log(
        "[supportApi.send] OK ticketId=",
        (res as any)?.data?.ticketId ?? null,
      );

      return (res as any)?.data ?? { ok: true };
    } catch (e) {
      console.log("[supportApi.send] FAIL ->", String(e));
      throw e;
    }
  },
};
