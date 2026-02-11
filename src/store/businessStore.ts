// src/store/businessStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";
import { businessService } from "../services/businessService";
import type { Business, Employee, ID, Supplier } from "../types/business";

type State = {
  // ✅ por usuario
  userId: string | null;

  // ✅ bandera épica
  hydrated: boolean;

  businesses: Business[];
  activeBusinessId: ID | null;

  employees: Employee[];
  suppliers: Supplier[];

  loading: boolean;
  error: string | null;
};

const BASE_KEY = "smartbiz.businessStore.v2";
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

function seedBusiness(): Business {
  return {
    id: "demo-biz",
    name: "Negocio X",
    legalName: "Negocio X S.A. de C.V.",
    phone: "33 0000 0000",
    email: "negocio@demo.com",
    address: "Guadalajara, Jalisco",
    status: "active",
    createdAt: new Date().toISOString(),
  };
}

async function hydrateForUser(userId: string) {
  // ✅ importante: NO disparar persist durante hydrate
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
    // storage corrupto -> arranque limpio
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

export const businessActions = {
  /**
   * ✅ ÉPICA: bootstrap por usuario
   * IMPORTANTE: debes llamarlo como businessActions.bootstrap(authUser.id)
   */
  async bootstrap(userId?: string) {
    if (!userId) {
      // compat: si tu layout viejo lo llama sin userId, al menos no truena
      if (!getState().hydrated)
        setState({ hydrated: true }, { skipPersist: true });
      return;
    }

    // ya hidratado para ese user
    if (getState().hydrated && getState().userId === userId) return;

    // arranque controlado
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

    // si no hay data, seed (o remoto)
    if (getState().businesses.length === 0) {
      try {
        const remote = await businessService.listBusinesses();
        const seed = remote.length > 0 ? remote : [seedBusiness()];
        setState({
          businesses: seed,
          activeBusinessId: seed[0]?.id ?? null,
        });
        await flush();
      } catch {
        const seed = [seedBusiness()];
        setState({
          businesses: seed,
          activeBusinessId: seed[0]?.id ?? null,
        });
        await flush();
      }
    }

    setState({ loading: false, hydrated: true });

    // precarga del negocio activo (sin reventar)
    const bizId = getState().activeBusinessId;
    if (bizId) {
      await this.loadEmployees(bizId);
      await this.loadSuppliers(bizId);
      await flush();
    }
  },

  /**
   * ✅ Limpia SOLO memoria (para UI), pero NO borra storage.
   * Útil si quieres “reset visual” al desloguear sin perder datos.
   */
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

  /**
   * ✅ Si algún día quieres borrar también storage del usuario actual.
   */
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

  setActiveBusiness(id: ID) {
    setState({ activeBusinessId: id });
    void this.loadEmployees(id);
    void this.loadSuppliers(id);
  },

  // ---- Businesses ----
  async createBusiness(input: Omit<Business, "id" | "createdAt">) {
    setState({ loading: true, error: null });
    try {
      const created = await businessService.createBusiness(input);

      const next = [created, ...getState().businesses];
      setState({
        businesses: next,
        activeBusinessId: created.id,
        loading: false,
      });

      await flush();

      // precarga dependientes
      await this.refreshEmployees(created.id);
      await this.refreshSuppliers(created.id);
      await flush();

      return created;
    } catch (e: any) {
      setState({ loading: false, error: e?.message ?? "Error" });
      throw e;
    }
  },

  async updateBusiness(id: ID, patch: Partial<Business>) {
    setState({ loading: true, error: null });

    const next = getState().businesses.map((b) =>
      b.id === id ? { ...b, ...patch } : b,
    );

    setState({ businesses: next, loading: false });
    await flush();

    try {
      await businessService.updateBusiness(id, patch);
    } catch {
      // demo
    }

    return getState().businesses.find((b) => b.id === id) ?? null;
  },

  async deleteBusiness(id: ID) {
    setState({ loading: true, error: null });

    const remaining = getState().businesses.filter((b) => b.id !== id);
    const nextActive = remaining[0]?.id ?? null;

    setState({
      businesses: remaining,
      activeBusinessId: nextActive,
      employees: getState().employees.filter((e) => e.businessId !== id),
      suppliers: getState().suppliers.filter((s) => s.businessId !== id),
      loading: false,
    });

    await flush();

    try {
      await businessService.deleteBusiness(id);
    } catch {
      // demo
    }

    if (nextActive) {
      await this.loadEmployees(nextActive);
      await this.loadSuppliers(nextActive);
      await flush();
    }
  },

  // ---- Employees ----
  async loadEmployees(businessId: ID) {
    const has = getState().employees.some((e) => e.businessId === businessId);
    if (has) return;
    await this.refreshEmployees(businessId);
    await flush();
  },

  async refreshEmployees(businessId: ID) {
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

  async addEmployeeQuick(fullName: string) {
    const bizId = getState().activeBusinessId;
    if (!bizId) return;

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
  async loadSuppliers(businessId: ID) {
    const has = getState().suppliers.some((s) => s.businessId === businessId);
    if (has) return;
    await this.refreshSuppliers(businessId);
    await flush();
  },

  async refreshSuppliers(businessId: ID) {
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

  async createSupplier(input: Omit<Supplier, "id" | "createdAt">) {
    const created = await businessService.createSupplier(input);
    setState({ suppliers: [created, ...getState().suppliers] });
    await flush();
    return created;
  },

  async updateSupplier(id: ID, patch: Partial<Supplier>) {
    setState({
      suppliers: getState().suppliers.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    });
    await flush();

    try {
      await businessService.updateSupplier(id, patch);
    } catch {
      // demo
    }

    return getState().suppliers.find((s) => s.id === id) ?? null;
  },

  async deleteSupplier(id: ID) {
    setState({ suppliers: getState().suppliers.filter((s) => s.id !== id) });
    await flush();

    try {
      await businessService.deleteSupplier(id);
    } catch {
      // demo
    }
  },
};

// Hook selector
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
