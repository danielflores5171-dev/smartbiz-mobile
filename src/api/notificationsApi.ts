// src/api/notificationsApi.ts
import { apiRequest } from "@/src/lib/apiClient";

export type ApiNotification = {
  id: string;
  user_id?: string;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  read_at?: string | null;
  created_at?: string | null;
};

export const notificationsApi = {
  list: (token: string) =>
    apiRequest<{
      unreadCount?: number;
      items: ApiNotification[];
      nextCursor?: string | null;
    }>("/api/notifications", {
      method: "GET",
      token,
    }),

  read: (token: string, body: { id: string; read?: boolean }) =>
    apiRequest<{}>("/api/notifications/read", {
      method: "POST",
      token,
      body,
    }),

  readAll: (token: string) =>
    apiRequest<{}>("/api/notifications/read-all", {
      method: "POST",
      token,
      body: {},
    }),

  remove: (token: string, body: { id: string }) =>
    apiRequest<{}>("/api/notifications/delete", {
      method: "POST",
      token,
      body,
    }),
};
