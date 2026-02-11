// src/services/notificationService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotificationKind = "system" | "sales" | "inventory" | "business";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  createdAt: string; // ISO
  read: boolean;

  // puedes extender sin romper: lo guardamos tal cual (demo)
  meta?: {
    route?: string; // ej: "/(tabs)/sales"
    entityId?: string;
    // extras opcionales para módulos (inventory/sales/etc)
    payload?: any;
  };
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function keyForUser(userId: string) {
  return `smartbiz.notifications.v1.${userId}`;
}

function seedDemo(): NotificationItem[] {
  const now = Date.now();
  const iso = (t: number) => new Date(t).toISOString();

  return [
    {
      id: uid(),
      title: "Bienvenido a SmartBiz",
      body: "Tu cuenta está lista. Explora el dashboard y configura tu negocio.",
      kind: "system",
      createdAt: iso(now - 60 * 60 * 1000),
      read: false,
      meta: { route: "/(tabs)/dashboard" },
    },
    {
      id: uid(),
      title: "Inventario bajo",
      body: "3 productos están por debajo del mínimo recomendado.",
      kind: "inventory",
      createdAt: iso(now - 3 * 60 * 60 * 1000),
      read: false,
      meta: { route: "/(tabs)/inventory" },
    },
    {
      id: uid(),
      title: "Venta registrada",
      body: "Se registró una venta en el negocio actual.",
      kind: "sales",
      createdAt: iso(now - 24 * 60 * 60 * 1000),
      read: true,
      meta: { route: "/(tabs)/sales" },
    },
  ];
}

async function readList(userId: string): Promise<NotificationItem[]> {
  const raw = await AsyncStorage.getItem(keyForUser(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as NotificationItem[];
  } catch {
    return [];
  }
}

async function writeList(userId: string, items: NotificationItem[]) {
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify(items));
}

function sortDesc(items: NotificationItem[]) {
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const notificationService = {
  // ✅ GET (demo). En real: fetch("/notifications")
  async list(userId: string): Promise<NotificationItem[]> {
    const items = await readList(userId);

    // si está vacío, sembramos demo para que se vea algo
    if (items.length === 0) {
      const seeded = seedDemo();
      await writeList(userId, seeded);
      return sortDesc(seeded);
    }

    return sortDesc(items);
  },

  // ✅ ADD (nuevo)
  async add(
    userId: string,
    input: Omit<NotificationItem, "id" | "createdAt"> & {
      id?: string;
      createdAt?: string;
    },
  ): Promise<NotificationItem[]> {
    const items = await readList(userId);

    const created: NotificationItem = {
      id: input.id ?? uid(),
      createdAt: input.createdAt ?? new Date().toISOString(),
      title: input.title,
      body: input.body,
      kind: input.kind,
      read: input.read ?? false,
      meta: input.meta,
    };

    const next = [created, ...items];
    await writeList(userId, next);
    return sortDesc(next);
  },

  // ✅ PATCH read/unread
  async markRead(userId: string, id: string, read: boolean) {
    const items = await readList(userId);
    const next = items.map((n) => (n.id === id ? { ...n, read } : n));
    await writeList(userId, next);
    return sortDesc(next);
  },

  async markAllRead(userId: string) {
    const items = await readList(userId);
    const next = items.map((n) => ({ ...n, read: true }));
    await writeList(userId, next);
    return sortDesc(next);
  },

  async remove(userId: string, id: string) {
    const items = await readList(userId);
    const next = items.filter((n) => n.id !== id);
    await writeList(userId, next);
    return sortDesc(next);
  },

  async clearAll(userId: string) {
    await writeList(userId, []);
    return [];
  },
};
