// src/store/businessStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";
import { businessService } from "../services/businessService";
import type { Business, Employee, ID, Supplier } from "../types/business";

type State = {
  // ✅ por usuario
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
        activeBusinessId: null, // ✅ NO activo por default
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
        activeBusinessId: parsed?.activeBusinessId ?? null, // ✅ respeta lo que el user eligió
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

export const businessActions = {
  /**
   * ✅ Bootstrap por usuario (OBLIGATORIO pasar userId)
   */
  async bootstrap(userId?: string) {
    if (!userId) {
      // si alguien lo llama sin userId, no truena, pero no cargamos nada
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

    // ✅ IMPORTANTÍSIMO:
    // Ya NO sembramos seed ni activamos nada.
    // Si quisieras traer remoto, lo haríamos solo para LISTAR,
    // pero sin autoseleccionar un negocio.
    try {
      const remote = await businessService.listBusinesses();
      if (remote.length > 0 && getState().businesses.length === 0) {
        setState({ businesses: remote }); // ✅ NO set activeBusinessId aquí
        await flush();
      }
    } catch {
      // demo: silencioso
    }

    setState({ loading: false, hydrated: true });

    // ✅ Si ya había un negocio activo (porque el usuario lo eligió antes),
    // precargamos dependientes.
    const bizId = getState().activeBusinessId;
    if (bizId) {
      await this.loadEmployees(bizId);
      await this.loadSuppliers(bizId);
      await flush();
    }
  },

  /**
   * Útil al desloguear para que no se quede “pegado” el state anterior.
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
   * ✅ El usuario elige manualmente su negocio
   */
  setActiveBusiness(id: ID | null) {
    setState({ activeBusinessId: id });
    if (id) {
      void this.loadEmployees(id);
      void this.loadSuppliers(id);
    }
  },

  // ---- Businesses ----
  async createBusiness(input: Omit<Business, "id" | "createdAt">) {
    setState({ loading: true, error: null });
    try {
      const created = await businessService.createBusiness(input);

      const next = [created, ...getState().businesses];

      // ✅ NO activar automáticamente
      setState({
        businesses: next,
        loading: false,
      });

      await flush();

      // NO precargamos empleados/proveedores si no está activo
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

    // ✅ Si borras el activo, se queda sin activo (null)
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

    try {
      await businessService.deleteBusiness(id);
    } catch {
      // demo
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
