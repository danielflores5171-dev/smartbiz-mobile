import { get, post } from "./http";
import type { ApiNotification, ID } from "./types";

export const notificationsApi = {
  list: (token: string) =>
    get<{ items: ApiNotification[] }>("/api/notifications", token),
  detail: (token: string, id: ID) =>
    get<{ notification: ApiNotification }>(`/api/notifications/${id}`, token),

  read: (token: string, body: any) =>
    post<{}>("/api/notifications/read", body, token),
  readAll: (token: string) =>
    post<{}>("/api/notifications/read-all", {}, token),
  remove: (token: string, body: any) =>
    post<{}>("/api/notifications/delete", body, token),
};
