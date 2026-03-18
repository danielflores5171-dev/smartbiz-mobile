// src/store/notificationStore.ts
import { useMemo, useSyncExternalStore } from "react";
import {
  notificationService,
  type NotificationItem,
  type NotificationKind,
} from "../services/notificationService";

import { apiRequest } from "@/src/lib/apiClient";

type State = {
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  items: NotificationItem[];
  userId: string | null;
};

type ApiNotificationRow = {
  id: string;
  user_id?: string;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  read_at?: string | null;
  created_at?: string | null;
};

let state: State = {
  hydrated: false,
  loading: false,
  error: null,
  items: [],
  userId: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

function getState() {
  return state;
}

function requireUserId() {
  const uid = getState().userId;
  if (!uid) throw new Error("No hay usuario para notificaciones.");
  return uid;
}

async function tryApi<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T | null> {
  try {
    console.log(`[${label}] CALL`);
    return await fn();
  } catch (e) {
    console.log(`[${label}] FAIL -> fallback demo:`, String(e));
    return null;
  }
}

type AddInput =
  | {
      kind: NotificationKind;
      title: string;
      body: string;
      meta?: NotificationItem["meta"];
    }
  | {
      type: string;
      title: string;
      message: string;
      businessId?: string;
      meta?: any;
    };

function mapTypeToKind(type: string): NotificationKind {
  const t = (type || "").toLowerCase();
  if (t.includes("invent")) return "inventory";
  if (t.includes("sale")) return "sales";
  if (t.includes("business")) return "business";
  if (t.includes("system")) return "system";
  if (t === "low_stock" || t === "inventory_move") return "inventory";
  return "system";
}

function defaultRouteForKind(kind: NotificationKind) {
  if (kind === "inventory") return "/inventory";
  if (kind === "sales") return "/sales";
  if (kind === "business") return "/business";
  return "/dashboard";
}

function mapApiRowToItem(row: ApiNotificationRow): NotificationItem {
  const kind = mapTypeToKind(String(row.type ?? "system"));

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "Notificación"),
    body: String(row.body ?? ""),
    kind,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    read: !!row.read_at,
    meta: {
      route: defaultRouteForKind(kind),
    },
  };
}

function normalizeIncoming(input: AddInput): {
  kind: NotificationKind;
  title: string;
  body: string;
  meta?: NotificationItem["meta"];
} {
  if ("kind" in input) {
    return {
      kind: input.kind,
      title: input.title,
      body: input.body,
      meta: input.meta,
    };
  }

  const kind = mapTypeToKind(input.type);

  return {
    kind,
    title: input.title,
    body: input.message,
    meta: {
      payload: { businessId: input.businessId, ...(input.meta ?? {}) },
      route: defaultRouteForKind(kind),
    },
  };
}

export const notificationActions = {
  async bootstrap(userId: string, token?: string | null) {
    console.log(
      "[notificationStore.bootstrap] userId=",
      userId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    if (getState().hydrated && getState().userId === userId) {
      console.log(
        "[notificationStore.bootstrap] skip: ya hidratado para este usuario",
      );
      return;
    }

    setState({
      loading: true,
      error: null,
      hydrated: false,
      userId,
      items: [],
    });

    if (token) {
      const apiRes = await tryApi(
        () =>
          apiRequest<{
            unreadCount?: number;
            items: ApiNotificationRow[];
            nextCursor?: string | null;
          }>("/api/notifications", {
            method: "GET",
            token,
          }),
        "notificationsApi.list",
      );

      const rawItems = (apiRes as any)?.data?.items as
        | ApiNotificationRow[]
        | undefined;

      if (Array.isArray(rawItems)) {
        const mapped = rawItems.map(mapApiRowToItem);
        setState({
          items: mapped,
          loading: false,
          hydrated: true,
          error: null,
          userId,
        });
        return;
      }
    }

    try {
      const items = await notificationService.list(userId);
      setState({
        items,
        loading: false,
        hydrated: true,
        error: null,
        userId,
      });
    } catch (e: any) {
      setState({
        loading: false,
        hydrated: true,
        error: e?.message ?? "No se pudieron cargar notificaciones.",
        userId,
      });
    }
  },

  async refresh(token?: string | null) {
    const userId = requireUserId();

    console.log(
      "[notificationStore.refresh] userId=",
      userId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    setState({ loading: true, error: null });

    if (token) {
      const apiRes = await tryApi(
        () =>
          apiRequest<{
            unreadCount?: number;
            items: ApiNotificationRow[];
            nextCursor?: string | null;
          }>("/api/notifications", {
            method: "GET",
            token,
          }),
        "notificationsApi.list",
      );

      const rawItems = (apiRes as any)?.data?.items as
        | ApiNotificationRow[]
        | undefined;

      if (Array.isArray(rawItems)) {
        setState({
          items: rawItems.map(mapApiRowToItem),
          loading: false,
          error: null,
          hydrated: true,
        });
        return;
      }
    }

    try {
      const items = await notificationService.list(userId);
      setState({ items, loading: false, error: null, hydrated: true });
    } catch (e: any) {
      setState({
        loading: false,
        error: e?.message ?? "No se pudo refrescar.",
      });
    }
  },

  async add(input: AddInput) {
    const userId = requireUserId();
    const normalized = normalizeIncoming(input);

    const optimistic: NotificationItem = {
      id: `ntf-local-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false,
      kind: normalized.kind,
      title: normalized.title,
      body: normalized.body,
      meta: normalized.meta,
    };

    setState({ items: [optimistic, ...getState().items], error: null });

    try {
      const next = await notificationService.add(userId, {
        kind: normalized.kind,
        title: normalized.title,
        body: normalized.body,
        read: false,
        meta: normalized.meta,
      });
      setState({ items: next, error: null });
    } catch (e: any) {
      setState({ error: e?.message ?? "No se pudo agregar notificación." });
    }
  },

  async markRead(id: string, read = true, token?: string | null) {
    const userId = requireUserId();

    console.log(
      "[notificationStore.markRead] id=",
      id,
      "read=",
      read,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    const prev = getState().items;
    setState({
      items: prev.map((n) => (n.id === id ? { ...n, read } : n)),
      error: null,
    });

    if (token) {
      const ok = await tryApi(
        () =>
          apiRequest<{}>("/api/notifications/read", {
            method: "POST",
            token,
            body: { id, read },
          }),
        "notificationsApi.read",
      );

      if (ok) {
        await this.refresh(token);
        return;
      }
    }

    try {
      const next = await notificationService.markRead(userId, id, read);
      setState({ items: next, error: null });
    } catch (e: any) {
      setState({ items: prev, error: e?.message ?? "No se pudo actualizar." });
    }
  },

  async markAllRead(token?: string | null) {
    const userId = requireUserId();

    console.log(
      "[notificationStore.markAllRead] tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    const prev = getState().items;
    setState({
      items: prev.map((n) => ({ ...n, read: true })),
      error: null,
    });

    if (token) {
      const ok = await tryApi(
        () =>
          apiRequest<{}>("/api/notifications/read-all", {
            method: "POST",
            token,
            body: {},
          }),
        "notificationsApi.readAll",
      );

      if (ok) {
        await this.refresh(token);
        return;
      }
    }

    try {
      const next = await notificationService.markAllRead(userId);
      setState({ items: next, error: null });
    } catch (e: any) {
      setState({
        items: prev,
        error: e?.message ?? "No se pudo marcar todo como leído.",
      });
    }
  },

  async remove(id: string, token?: string | null) {
    const userId = requireUserId();

    console.log(
      "[notificationStore.remove] id=",
      id,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    const prev = getState().items;
    setState({
      items: prev.filter((n) => n.id !== id),
      error: null,
    });

    if (token) {
      const ok = await tryApi(
        () =>
          apiRequest<{}>("/api/notifications/delete", {
            method: "POST",
            token,
            body: { id },
          }),
        "notificationsApi.remove",
      );

      if (ok) {
        await this.refresh(token);
        return;
      }
    }

    try {
      const next = await notificationService.remove(userId, id);
      setState({ items: next, error: null });
    } catch (e: any) {
      setState({ items: prev, error: e?.message ?? "No se pudo eliminar." });
    }
  },

  async clearAll() {
    const userId = requireUserId();

    console.log("[notificationStore.clearAll] local-only fallback demo");

    const prev = getState().items;
    setState({ items: [], error: null });

    try {
      const next = await notificationService.clearAll(userId);
      setState({ items: next, error: null });
    } catch (e: any) {
      setState({
        items: prev,
        error: e?.message ?? "No se pudo limpiar.",
      });
    }
  },

  clearLocalMemoryOnly() {
    setState({
      items: [],
      hydrated: false,
      loading: false,
      error: null,
      userId: null,
    });
  },

  clearLocal() {
    this.clearLocalMemoryOnly();
  },
};

export function useNotificationStore<T>(selector: (s: State) => T): T {
  const snap = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(getState()),
    () => selector(getState()),
  );

  return useMemo(() => snap, [snap]);
}
