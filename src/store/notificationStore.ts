// src/store/notificationStore.ts
import { useMemo, useSyncExternalStore } from "react";
import {
  notificationService,
  type NotificationItem,
  type NotificationKind,
} from "../services/notificationService";

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

// ✅ payload flexible (para inventoryStore / legacy)
type AddInput =
  | {
      kind: NotificationKind;
      title: string;
      body: string;
      meta?: NotificationItem["meta"];
    }
  | {
      type: string; // legacy: "low_stock" | "inventory_move" | "system" ...
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
  // ⚠️ pásale userId desde tabs layout cuando hay sesión
  async bootstrap(userId: string) {
    if (getState().hydrated && getState().userId === userId) return;

    setState({
      loading: true,
      error: null,
      hydrated: false,
      userId,
      items: [],
    });

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

  async refresh() {
    const userId = requireUserId();
    setState({ loading: true, error: null });
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

  async markRead(id: string, read = true) {
    const userId = requireUserId();
    setState({
      items: getState().items.map((n) => (n.id === id ? { ...n, read } : n)),
    });

    try {
      const next = await notificationService.markRead(userId, id, read);
      setState({ items: next, error: null });
    } catch (e: any) {
      await this.refresh();
      setState({ error: e?.message ?? "No se pudo actualizar." });
    }
  },

  async markAllRead() {
    const userId = requireUserId();
    setState({ items: getState().items.map((n) => ({ ...n, read: true })) });

    try {
      const next = await notificationService.markAllRead(userId);
      setState({ items: next, error: null });
    } catch (e: any) {
      await this.refresh();
      setState({ error: e?.message ?? "No se pudo marcar todo como leído." });
    }
  },

  async remove(id: string) {
    const userId = requireUserId();
    setState({ items: getState().items.filter((n) => n.id !== id) });

    try {
      const next = await notificationService.remove(userId, id);
      setState({ items: next, error: null });
    } catch (e: any) {
      await this.refresh();
      setState({ error: e?.message ?? "No se pudo eliminar." });
    }
  },

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

  // ✅ nombre consistente con otros stores (para authStore)
  clearLocalMemoryOnly() {
    setState({
      items: [],
      hydrated: false,
      loading: false,
      error: null,
      userId: null,
    });
  },

  // compat (por si hay código viejo)
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
