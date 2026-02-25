// src/store/notificationStore.ts
import { useMemo, useSyncExternalStore } from "react";
import {
  notificationService,
  type NotificationItem,
  type NotificationKind,
} from "../services/notificationService";

// ✅ API client real (Bearer + contrato {ok:true,data:{...}})
import { apiRequest } from "@/src/lib/apiClient";

type State = {
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  items: NotificationItem[];
  userId: string | null;
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

// ✅ helper: intenta API; si falla, regresa null (fallback demo)
async function tryApi<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

// ✅ payload flexible (para inventoryStore / legacy)
type AddInput =
  | {
      kind: NotificationKind;
      title: string;
      body: string;
      meta?: NotificationItem["meta"];
    }
  | {
      type: string; // legacy
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

export const notificationActions = {
  /**
   * ✅ Bootstrap
   * Si pasas token: GET /api/notifications
   * Si falla: notificationService.list(userId)
   */
  async bootstrap(userId: string, token?: string | null) {
    if (getState().hydrated && getState().userId === userId) return;

    setState({
      loading: true,
      error: null,
      hydrated: false,
      userId,
      items: [],
    });

    // 1) API real
    if (token) {
      const apiRes = await tryApi(() =>
        apiRequest<{ items: NotificationItem[] }>("/api/notifications", {
          method: "GET",
          token,
        }),
      );
      const items = (apiRes as any)?.data?.items as
        | NotificationItem[]
        | undefined;
      if (items && Array.isArray(items)) {
        setState({ items, loading: false, hydrated: true, error: null });
        return;
      }
    }

    // 2) fallback demo
    try {
      const items = await notificationService.list(userId);
      setState({ items, loading: false, hydrated: true, error: null });
    } catch (e: any) {
      setState({
        loading: false,
        hydrated: true,
        error: e?.message ?? "No se pudieron cargar notificaciones.",
      });
    }
  },

  /**
   * Refresh
   * Si token: GET /api/notifications
   * Si falla: demo list
   */
  async refresh(token?: string | null) {
    const userId = requireUserId();
    setState({ loading: true, error: null });

    // 1) API real
    if (token) {
      const apiRes = await tryApi(() =>
        apiRequest<{ items: NotificationItem[] }>("/api/notifications", {
          method: "GET",
          token,
        }),
      );
      const items = (apiRes as any)?.data?.items as
        | NotificationItem[]
        | undefined;
      if (items && Array.isArray(items)) {
        setState({ items, loading: false, error: null, hydrated: true });
        return;
      }
    }

    // 2) fallback demo
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

  /**
   * Add (local-only por ahora)
   * Tu backend no muestra un POST /api/notifications para crear,
   * así que esta acción se queda como demo/local (sirve perfecto para eventos de UI).
   */
  async add(input: AddInput) {
    const userId = requireUserId();

    const normalized: {
      kind: NotificationKind;
      title: string;
      body: string;
      meta?: NotificationItem["meta"];
    } =
      "kind" in input
        ? {
            kind: input.kind,
            title: input.title,
            body: input.body,
            meta: input.meta,
          }
        : {
            kind: mapTypeToKind(input.type),
            title: input.title,
            body: input.message,
            meta: {
              payload: { businessId: input.businessId, ...(input.meta ?? {}) },
              route:
                mapTypeToKind(input.type) === "inventory"
                  ? "/(tabs)/inventory"
                  : mapTypeToKind(input.type) === "sales"
                    ? "/(tabs)/sales"
                    : "/(tabs)/dashboard",
            },
          };

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

  /**
   * Mark read
   * API real: POST /api/notifications/read
   * fallback: notificationService.markRead
   */
  async markRead(id: string, read = true, token?: string | null) {
    const userId = requireUserId();

    // optimista local
    setState({
      items: getState().items.map((n) => (n.id === id ? { ...n, read } : n)),
    });

    // 1) API real
    if (token) {
      const ok = await tryApi(() =>
        apiRequest<{}>("/api/notifications/read", {
          method: "POST",
          token,
          body: { id, read },
        }),
      );
      if (ok) {
        // opcional: refrescar desde API para consistencia
        await this.refresh(token);
        return;
      }
    }

    // 2) fallback demo
    try {
      const next = await notificationService.markRead(userId, id, read);
      setState({ items: next, error: null });
    } catch (e: any) {
      await this.refresh(token);
      setState({ error: e?.message ?? "No se pudo actualizar." });
    }
  },

  /**
   * Mark all read
   * API real: POST /api/notifications/read-all
   * fallback: notificationService.markAllRead
   */
  async markAllRead(token?: string | null) {
    const userId = requireUserId();

    setState({ items: getState().items.map((n) => ({ ...n, read: true })) });

    // 1) API real
    if (token) {
      const ok = await tryApi(() =>
        apiRequest<{}>("/api/notifications/read-all", {
          method: "POST",
          token,
          body: {},
        }),
      );
      if (ok) {
        await this.refresh(token);
        return;
      }
    }

    // 2) fallback demo
    try {
      const next = await notificationService.markAllRead(userId);
      setState({ items: next, error: null });
    } catch (e: any) {
      await this.refresh(token);
      setState({ error: e?.message ?? "No se pudo marcar todo como leído." });
    }
  },

  /**
   * Remove
   * API real: POST /api/notifications/delete
   * fallback: notificationService.remove
   */
  async remove(id: string, token?: string | null) {
    const userId = requireUserId();

    setState({ items: getState().items.filter((n) => n.id !== id) });

    // 1) API real
    if (token) {
      const ok = await tryApi(() =>
        apiRequest<{}>("/api/notifications/delete", {
          method: "POST",
          token,
          body: { id },
        }),
      );
      if (ok) {
        await this.refresh(token);
        return;
      }
    }

    // 2) fallback demo
    try {
      const next = await notificationService.remove(userId, id);
      setState({ items: next, error: null });
    } catch (e: any) {
      await this.refresh(token);
      setState({ error: e?.message ?? "No se pudo eliminar." });
    }
  },

  /**
   * Clear all
   * No hay endpoint claro en tu lista para "clear all" remoto,
   * así que se queda demo/local por ahora.
   */
  async clearAll() {
    const userId = requireUserId();
    setState({ items: [] });
    try {
      const next = await notificationService.clearAll(userId);
      setState({ items: next, error: null });
    } catch (e: any) {
      setState({ error: e?.message ?? "No se pudo limpiar." });
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
