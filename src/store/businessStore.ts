// src/store/businessStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";
import { businessService } from "../services/businessService";
import type { Business, Employee, ID, Supplier } from "../types/business";

// ✅ NUEVO: adapters API reales (ajusta rutas si tu carpeta api es otra)
import { businessApi } from "@/src/api/businessApi";
import { employeesApi } from "@/src/api/employeesApi";
import { suppliersApi } from "@/src/api/suppliersApi";

type State = {
  userId: string | null;
  hydrated: boolean;

  businesses: Business[];
  activeBusinessId: ID | null;

  employees: Employee[];
  suppliers: Supplier[];

  loading: boolean;
  error: string | null;
};

const BASE_KEY = "smartbiz.businessStore.v3";
const keyForUser = (userId: string) => `${BASE_KEY}:${userId}`;

const state: State = {
  userId: null,
  hydrated: false,

  businesses: [],
  activeBusinessId: null,

  employees: [],
  suppliers: [],

  loading: false,
  error: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const getState = () => state;

let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function persistNow() {
  const s = getState();
  if (!s.hydrated) return;
  if (!s.userId) return;

  const payload = {
    businesses: s.businesses,
    activeBusinessId: s.activeBusinessId,
    employees: s.employees,
    suppliers: s.suppliers,
  };

  await AsyncStorage.setItem(keyForUser(s.userId), JSON.stringify(payload));
}

function persist() {
  const s = getState();
  if (!s.hydrated) return;
  if (!s.userId) return;

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      await persistNow();
    } catch {
      // demo silencioso
    }
  }, 120);
}

async function flush() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    await persistNow();
  } catch {
    // demo silencioso
  }
}

function setState(patch: Partial<State>, opts?: { skipPersist?: boolean }) {
  Object.assign(state, patch);
  emit();
  if (!opts?.skipPersist) persist();
}

async function hydrateForUser(userId: string) {
  const raw = await AsyncStorage.getItem(keyForUser(userId));

  if (!raw) {
    setState(
      {
        userId,
        hydrated: true,
        businesses: [],
        activeBusinessId: null,
        employees: [],
        suppliers: [],
        loading: false,
        error: null,
      },
      { skipPersist: true },
    );
    return;
  }

  try {
    const parsed = JSON.parse(raw) as any;

    setState(
      {
        userId,
        hydrated: true,
        businesses: parsed?.businesses ?? [],
        activeBusinessId: parsed?.activeBusinessId ?? null,
        employees: parsed?.employees ?? [],
        suppliers: parsed?.suppliers ?? [],
        loading: false,
        error: null,
      },
      { skipPersist: true },
    );
  } catch {
    setState(
      {
        userId,
        hydrated: true,
        businesses: [],
        activeBusinessId: null,
        employees: [],
        suppliers: [],
        loading: false,
        error: null,
      },
      { skipPersist: true },
    );
  }
}

/**
 * Helper: intenta API; si falla, cae a demo.
 */
async function tryApi<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export const businessActions = {
  /**
   * ✅ Bootstrap por usuario
   * Si mandas token, intentará API real primero, si falla cae al demo.
   */
  async bootstrap(userId?: string, token?: string) {
    if (!userId) {
      if (!getState().hydrated)
        setState({ hydrated: true }, { skipPersist: true });
      return;
    }

    if (getState().hydrated && getState().userId === userId) return;

    setState(
      {
        userId,
        hydrated: false,
        loading: true,
        error: null,
        businesses: [],
        activeBusinessId: null,
        employees: [],
        suppliers: [],
      },
      { skipPersist: true },
    );

    await hydrateForUser(userId);

    // 1) Intentar traer businesses desde API real
    if (token) {
      const apiRes = await tryApi(() => businessApi.list(token));
      if (apiRes && Array.isArray((apiRes as any).data?.items)) {
        const items = (apiRes as any).data.items as Business[];
        if (items.length > 0) {
          // ✅ NO autoseleccionamos negocio
          setState({ businesses: items });
          await flush();
        }
      }
    }

    // 2) Fallback demo si no hay businesses aún
    if (getState().businesses.length === 0) {
      try {
        const remote = await businessService.listBusinesses();
        if (remote.length > 0) {
          setState({ businesses: remote });
          await flush();
        }
      } catch {
        // demo silencioso
      }
    }

    setState({ loading: false, hydrated: true });

    // ✅ Si el usuario ya tenía un negocio activo en local, precarga dependientes.
    const bizId = getState().activeBusinessId;
    if (bizId) {
      await this.loadEmployees(bizId, token);
      await this.loadSuppliers(bizId, token);
      await flush();
    }
  },

  clearLocalMemoryOnly() {
    setState(
      {
        userId: null,
        hydrated: false,
        businesses: [],
        activeBusinessId: null,
        employees: [],
        suppliers: [],
        loading: false,
        error: null,
      },
      { skipPersist: true },
    );
  },

  async clearLocalAndStorage() {
    const uid = getState().userId;
    this.clearLocalMemoryOnly();
    if (uid) {
      try {
        await AsyncStorage.removeItem(keyForUser(uid));
      } catch {
        // demo
      }
    }
  },

  async flush() {
    await flush();
  },

  get activeBusiness(): Business | null {
    const s = getState();
    return s.businesses.find((b) => b.id === s.activeBusinessId) ?? null;
  },

  /**
   * ✅ El usuario elige manualmente negocio activo
   * (si luego quieres sincronizarlo a backend, lo hacemos cuando tengas permisos)
   */
  setActiveBusiness(id: ID | null) {
    setState({ activeBusinessId: id });
    if (id) {
      void this.loadEmployees(id);
      void this.loadSuppliers(id);
    }
  },

  // ---- Businesses ----
  async createBusiness(
    input: Omit<Business, "id" | "createdAt">,
    token?: string,
  ) {
    setState({ loading: true, error: null });
    try {
      // API real si token
      if (token) {
        const apiRes = await tryApi(() => businessApi.create(token, input));
        const created = (apiRes as any)?.data?.business as Business | undefined;
        if (created) {
          setState({
            businesses: [created, ...getState().businesses],
            loading: false,
          });
          await flush();
          return created;
        }
      }

      // fallback demo
      const created = await businessService.createBusiness(input);
      setState({
        businesses: [created, ...getState().businesses],
        loading: false,
      });
      await flush();
      return created;
    } catch (e: any) {
      setState({ loading: false, error: e?.message ?? "Error" });
      throw e;
    }
  },

  async updateBusiness(id: ID, patch: Partial<Business>, token?: string) {
    setState({ loading: true, error: null });

    // optimista local
    const next = getState().businesses.map((b) =>
      b.id === id ? { ...b, ...patch } : b,
    );
    setState({ businesses: next, loading: false });
    await flush();

    // API real si token; si falla, demo
    if (token) {
      const ok = await tryApi(() => businessApi.update(token, id, patch));
      if (ok) return getState().businesses.find((b) => b.id === id) ?? null;
    }

    try {
      await businessService.updateBusiness(id, patch);
    } catch {
      // demo
    }

    return getState().businesses.find((b) => b.id === id) ?? null;
  },

  async deleteBusiness(id: ID, token?: string) {
    setState({ loading: true, error: null });

    const remaining = getState().businesses.filter((b) => b.id !== id);
    const nextActive =
      getState().activeBusinessId === id ? null : getState().activeBusinessId;

    setState({
      businesses: remaining,
      activeBusinessId: nextActive,
      employees: getState().employees.filter((e) => e.businessId !== id),
      suppliers: getState().suppliers.filter((s) => s.businessId !== id),
      loading: false,
    });

    await flush();

    if (token) {
      const ok = await tryApi(() => businessApi.remove(token, id));
      if (ok) return;
    }

    try {
      await businessService.deleteBusiness(id);
    } catch {
      // demo
    }
  },

  // ---- Employees ----
  async loadEmployees(businessId: ID, token?: string) {
    const has = getState().employees.some((e) => e.businessId === businessId);
    if (has) return;
    await this.refreshEmployees(businessId, token);
    await flush();
  },

  async refreshEmployees(businessId: ID, token?: string) {
    // API real
    if (token) {
      const apiRes = await tryApi(() => employeesApi.list(token, businessId));
      const items = (apiRes as any)?.data?.items as Employee[] | undefined;
      if (items && Array.isArray(items)) {
        const others = getState().employees.filter(
          (e) => e.businessId !== businessId,
        );
        setState({ employees: [...items, ...others] });
        return;
      }
    }

    // fallback demo
    try {
      const list = await businessService.listEmployees(businessId);
      const seed: Employee[] =
        list.length > 0
          ? list
          : [
              {
                id: `emp-demo-${businessId}`,
                businessId,
                fullName: "Andrés López",
                role: "ADMIN",
                status: "active",
                email: "andres@demo.com",
                createdAt: new Date().toISOString(),
              },
            ];

      const others = getState().employees.filter(
        (e) => e.businessId !== businessId,
      );
      setState({ employees: [...seed, ...others] });
    } catch {
      // demo
    }
  },

  async addEmployeeQuick(fullName: string, token?: string) {
    const bizId = getState().activeBusinessId;
    if (!bizId) return;

    // API real si token (si tu endpoint requiere body más completo, ajustamos luego)
    if (token) {
      const apiRes = await tryApi(() =>
        employeesApi.create(token, bizId, {
          fullName,
          role: "STAFF",
          status: "active",
        }),
      );
      const created = (apiRes as any)?.data?.member as Employee | undefined;
      if (created) {
        setState({ employees: [created, ...getState().employees] });
        await flush();
        return;
      }
    }

    // fallback demo
    const created = await businessService.createEmployee({
      businessId: bizId,
      fullName,
      role: "STAFF",
      status: "active",
    });

    setState({ employees: [created, ...getState().employees] });
    await flush();
  },

  async updateEmployeeLocal(id: ID, patch: Partial<Employee>) {
    const next = getState().employees.map((e) =>
      e.id === id ? { ...e, ...patch } : e,
    );
    setState({ employees: next });
    await flush();
  },

  // ---- Suppliers ----
  async loadSuppliers(businessId: ID, token?: string) {
    const has = getState().suppliers.some((s) => s.businessId === businessId);
    if (has) return;
    await this.refreshSuppliers(businessId, token);
    await flush();
  },

  async refreshSuppliers(businessId: ID, token?: string) {
    // API real
    if (token) {
      const apiRes = await tryApi(() => suppliersApi.list(token, businessId));
      const items = (apiRes as any)?.data?.items as Supplier[] | undefined;
      if (items && Array.isArray(items)) {
        const others = getState().suppliers.filter(
          (s) => s.businessId !== businessId,
        );
        setState({ suppliers: [...items, ...others] });
        return;
      }
    }

    // fallback demo
    try {
      const list = await businessService.listSuppliers(businessId);

      const seed: Supplier[] =
        list.length > 0
          ? list
          : [
              {
                id: `sup-demo-${businessId}`,
                businessId,
                name: "Proveedor Demo",
                contactName: "Contacto Demo",
                phone: "33 1111 1111",
                email: "proveedor@demo.com",
                notes: "Demo local",
                createdAt: new Date().toISOString(),
              },
            ];

      const others = getState().suppliers.filter(
        (s) => s.businessId !== businessId,
      );
      setState({ suppliers: [...seed, ...others] });
    } catch {
      // demo
    }
  },

  async createSupplier(
    input: Omit<Supplier, "id" | "createdAt">,
    token?: string,
  ) {
    // API real
    if (token) {
      const apiRes = await tryApi(() =>
        suppliersApi.create(token, input.businessId, input),
      );
      const created = (apiRes as any)?.data?.supplier as Supplier | undefined;
      if (created) {
        setState({ suppliers: [created, ...getState().suppliers] });
        await flush();
        return created;
      }
    }

    // fallback demo
    const created = await businessService.createSupplier(input);
    setState({ suppliers: [created, ...getState().suppliers] });
    await flush();
    return created;
  },

  async updateSupplier(id: ID, patch: Partial<Supplier>, token?: string) {
    setState({
      suppliers: getState().suppliers.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    });
    await flush();

    if (token) {
      const bizId =
        patch.businessId ??
        getState().suppliers.find((s) => s.id === id)?.businessId;
      if (bizId) {
        const ok = await tryApi(() =>
          suppliersApi.update(token, bizId, id, patch),
        );
        if (ok) return getState().suppliers.find((s) => s.id === id) ?? null;
      }
    }

    try {
      await businessService.updateSupplier(id, patch);
    } catch {
      // demo
    }

    return getState().suppliers.find((s) => s.id === id) ?? null;
  },

  async deleteSupplier(id: ID, token?: string) {
    const sup = getState().suppliers.find((s) => s.id === id);
    setState({ suppliers: getState().suppliers.filter((s) => s.id !== id) });
    await flush();

    if (token && sup?.businessId) {
      const ok = await tryApi(() =>
        suppliersApi.remove(token, sup.businessId, id),
      );
      if (ok) return;
    }

    try {
      await businessService.deleteSupplier(id);
    } catch {
      // demo
    }
  },
};

export function useBusinessStore<T>(selector: (s: State) => T): T {
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
