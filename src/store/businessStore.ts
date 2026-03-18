import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";
import { businessService } from "../services/businessService";
import type {
  Business,
  Employee,
  EmployeeRole,
  ID,
  Supplier,
} from "../types/business";

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

const BASE_KEY = "smartbiz.businessStore.v6";
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
let bootstrapInFlight = false;

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
        activeBusinessId: null,
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

/* ------------------ HELPERS / MAPPERS ------------------ */

function mapApiBusinessItemToBusiness(it: any): Business {
  return {
    id: String(it?.id ?? "") as ID,
    name: String(it?.name ?? ""),
    status: it?.status ?? "active",
    createdAt: String(it?.created_at ?? new Date().toISOString()),
  };
}

function toAppEmployeeRole(role: unknown): EmployeeRole {
  const r = String(role ?? "")
    .toLowerCase()
    .trim();
  if (r === "admin") return "ADMIN";
  if (r === "manager") return "MANAGER";
  if (r === "cashier") return "CASHIER";
  return "STAFF";
}

function toApiEmployeeRole(
  role: EmployeeRole,
): "admin" | "manager" | "cashier" | "viewer" {
  if (role === "ADMIN") return "admin";
  if (role === "MANAGER") return "manager";
  if (role === "CASHIER") return "cashier";
  return "viewer";
}

function mapApiEmployeeItemToEmployee(it: any, businessId: ID): Employee {
  return {
    id: String(it?.user_id ?? it?.id ?? "") as ID,
    businessId,
    fullName: String(it?.name ?? it?.full_name ?? it?.email ?? ""),
    email: it?.email ? String(it.email) : undefined,
    role: toAppEmployeeRole(it?.role),
    status: "active",
    createdAt: String(it?.created_at ?? new Date().toISOString()),
  };
}

function mapApiSupplierItemToSupplier(it: any): Supplier {
  return {
    id: String(it?.id ?? "") as ID,
    businessId: String(it?.business_id ?? "") as ID,
    name: String(it?.name ?? ""),
    phone: it?.phone ? String(it.phone) : undefined,
    email: it?.email ? String(it.email) : undefined,
    createdAt: String(it?.created_at ?? new Date().toISOString()),
    contactName: "",
    notes: "",
  };
}

function buildSupplierApiBody(input: Partial<Supplier>) {
  return {
    name: input.name?.trim() ?? "",
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    address: null,
  };
}

export const businessActions = {
  async bootstrap(userId?: string, token?: string) {
    console.log(
      "[businessStore.bootstrap] userId=",
      userId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    if (bootstrapInFlight) {
      console.log("[businessStore.bootstrap] skip: bootstrap en curso");
      return;
    }

    if (!userId) {
      if (!getState().hydrated) {
        setState({ hydrated: true }, { skipPersist: true });
      }
      return;
    }

    if (getState().hydrated && getState().userId === userId) {
      console.log(
        "[businessStore.bootstrap] skip: ya hidratado para este usuario",
      );
      return;
    }

    bootstrapInFlight = true;

    try {
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

      if (token) {
        console.log("[businessStore.bootstrap] calling businessApi.list...");
        const apiRes = await tryApi(
          () => businessApi.list(token),
          "businessApi.list",
        );
        const rawItems = (apiRes as any)?.data?.items;

        if (Array.isArray(rawItems)) {
          const items = rawItems.map(mapApiBusinessItemToBusiness);
          console.log(
            "[businessStore.bootstrap] businesses from API:",
            items.length,
          );
          setState({
            businesses: items,
            activeBusinessId: null,
          });
          await flush();
        } else {
          console.log("[businessStore.bootstrap] API returned no items array");
        }
      } else {
        console.log("[businessStore.bootstrap] no token, skipping API");
      }

      if (getState().businesses.length === 0) {
        console.log(
          "[businessStore.bootstrap] using fallback demo/businessService",
        );
        try {
          const remote = await businessService.listBusinesses();
          if (remote.length > 0) {
            setState({
              businesses: remote,
              activeBusinessId: null,
            });
            await flush();
          }
        } catch {
          // demo
        }
      }

      setState({
        activeBusinessId: null,
        loading: false,
        hydrated: true,
      });

      await flush();
    } finally {
      bootstrapInFlight = false;
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

  setActiveBusiness(id: ID | null, token?: string) {
    console.log("[businessStore.setActiveBusiness] id=", id);

    setState({ activeBusinessId: id });

    if (!id) {
      console.log("[businessStore.setActiveBusiness] deactivated business");
      return;
    }

    console.log("[businessStore.setActiveBusiness] activated business=", id);

    void this.loadEmployees(id, token);
    void this.loadSuppliers(id, token);
  },

  // ---- Businesses ----
  async createBusiness(
    input: Omit<Business, "id" | "createdAt">,
    token?: string,
  ) {
    console.log(
      "[businessStore.createBusiness] name=",
      input.name,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    setState({ loading: true, error: null });

    try {
      if (token) {
        const apiRes = await tryApi(
          () => businessApi.create(token, { name: input.name }),
          "businessApi.create",
        );

        const it = (apiRes as any)?.data?.item;
        if (it) {
          const created = mapApiBusinessItemToBusiness(it);
          setState({
            businesses: [created, ...getState().businesses],
            loading: false,
          });
          await flush();
          return created;
        }
      }

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
    console.log("[businessStore.updateBusiness] id=", id, "patch=", patch);

    setState({ loading: true, error: null });

    const next = getState().businesses.map((b) =>
      b.id === id ? { ...b, ...patch } : b,
    );
    setState({ businesses: next, loading: false });
    await flush();

    if (token) {
      const name = patch?.name;
      if (typeof name === "string" && name.trim()) {
        await tryApi(
          () => businessApi.update(token, id, { name }),
          "businessApi.update",
        );
      }
    }

    try {
      await businessService.updateBusiness(id, patch);
    } catch {
      // demo
    }

    return getState().businesses.find((b) => b.id === id) ?? null;
  },

  async deleteBusiness(id: ID, token?: string) {
    console.log("[businessStore.deleteBusiness] id=", id);

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
      await tryApi(() => businessApi.remove(token, id), "businessApi.remove");
    }

    try {
      await businessService.deleteBusiness(id);
    } catch {
      // demo
    }
  },

  // ---- Employees ----
  async loadEmployees(businessId: ID, token?: string) {
    console.log(
      "[businessStore.loadEmployees] businessId=",
      businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    const has = getState().employees.some((e) => e.businessId === businessId);
    if (has) {
      console.log("[businessStore.loadEmployees] skip: ya cargados");
      return;
    }

    await this.refreshEmployees(businessId, token);
    await flush();
  },

  async refreshEmployees(businessId: ID, token?: string) {
    console.log(
      "[businessStore.refreshEmployees] businessId=",
      businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    if (token) {
      const apiRes = await tryApi(
        () => employeesApi.list(token, businessId),
        "employeesApi.list",
      );
      const raw = (apiRes as any)?.data?.items;

      if (Array.isArray(raw)) {
        console.log("[businessStore.refreshEmployees] API items=", raw.length);
        const items = raw.map((it: any) =>
          mapApiEmployeeItemToEmployee(it, businessId),
        );
        const others = getState().employees.filter(
          (e) => e.businessId !== businessId,
        );
        setState({ employees: [...items, ...others] });
        await flush();
        return;
      }
    }

    console.log("[businessStore.refreshEmployees] fallback demo");

    try {
      const list = await businessService.listEmployees(businessId);
      const seed: Employee[] =
        list.length > 0
          ? list
          : [
              {
                id: `emp-demo-${businessId}` as any,
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
      await flush();
    } catch {
      // demo
    }
  },

  async addEmployee(
    input: { email: string; role: EmployeeRole },
    token?: string,
  ) {
    const bizId = getState().activeBusinessId;
    if (!bizId) throw new Error("Primero selecciona un negocio.");

    const email = input.email.trim().toLowerCase();
    if (!email) throw new Error("Ingresa un correo.");

    console.log(
      "[businessStore.addEmployee] businessId=",
      bizId,
      "email=",
      email,
      "role=",
      input.role,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    if (token) {
      const apiRes = await tryApi(
        () =>
          employeesApi.create(token, bizId, {
            email,
            role: toApiEmployeeRole(input.role),
          }),
        "employeesApi.create",
      );

      const it = (apiRes as any)?.data?.item;
      if (it) {
        const created = mapApiEmployeeItemToEmployee(it, bizId);
        setState({
          employees: [created, ...getState().employees],
          error: null,
        });
        await flush();
        return created;
      }

      console.log(
        "[businessStore.addEmployee] backend unavailable -> fallback local/demo",
      );
    } else {
      console.log(
        "[businessStore.addEmployee] no token -> fallback local/demo",
      );
    }

    const localEmployee: Employee = {
      id: `emp-local-${Date.now()}` as ID,
      businessId: bizId,
      fullName: email.split("@")[0] || "Empleado demo",
      email,
      role: input.role,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    setState({
      employees: [localEmployee, ...getState().employees],
      error: null,
    });

    await flush();
    return localEmployee;
  },

  async updateEmployeeLocal(id: ID, patch: Partial<Employee>) {
    console.log("[businessStore.updateEmployeeLocal] id=", id, "patch=", patch);

    const next = getState().employees.map((e) =>
      e.id === id ? { ...e, ...patch } : e,
    );
    setState({ employees: next });
    await flush();
  },

  // ---- Suppliers ----
  async loadSuppliers(businessId: ID, token?: string) {
    console.log(
      "[businessStore.loadSuppliers] businessId=",
      businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    const has = getState().suppliers.some((s) => s.businessId === businessId);
    if (has) {
      console.log("[businessStore.loadSuppliers] skip: ya cargados");
      return;
    }

    await this.refreshSuppliers(businessId, token);
    await flush();
  },

  async refreshSuppliers(businessId: ID, token?: string) {
    console.log(
      "[businessStore.refreshSuppliers] businessId=",
      businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    if (token) {
      const apiRes = await tryApi(
        () => suppliersApi.list(token, businessId),
        "suppliersApi.list",
      );
      const raw = (apiRes as any)?.data?.items;

      if (Array.isArray(raw)) {
        console.log("[businessStore.refreshSuppliers] API items=", raw.length);
        const items = raw.map((it: any) => mapApiSupplierItemToSupplier(it));
        const others = getState().suppliers.filter(
          (s) => s.businessId !== businessId,
        );
        setState({ suppliers: [...items, ...others] });
        await flush();
        return;
      }
    }

    console.log("[businessStore.refreshSuppliers] fallback demo");

    try {
      const list = await businessService.listSuppliers(businessId);

      const seed: Supplier[] =
        list.length > 0
          ? list
          : [
              {
                id: `sup-demo-${businessId}` as any,
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
      await flush();
    } catch {
      // demo
    }
  },

  async createSupplier(
    input: Omit<Supplier, "id" | "createdAt">,
    token?: string,
  ) {
    console.log(
      "[businessStore.createSupplier] businessId=",
      input.businessId,
      "name=",
      input.name,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    if (token) {
      const apiRes = await tryApi(
        () =>
          suppliersApi.create(
            token,
            input.businessId,
            buildSupplierApiBody(input),
          ),
        "suppliersApi.create",
      );

      const it = (apiRes as any)?.data?.item;
      if (it) {
        const created = {
          ...mapApiSupplierItemToSupplier(it),
          contactName: input.contactName,
          notes: input.notes,
        };
        setState({ suppliers: [created, ...getState().suppliers] });
        await flush();
        return created;
      }
    }

    console.log("[businessStore.createSupplier] fallback demo");

    const created = await businessService.createSupplier(input);
    setState({ suppliers: [created, ...getState().suppliers] });
    await flush();
    return created;
  },

  async updateSupplier(id: ID, patch: Partial<Supplier>, token?: string) {
    console.log(
      "[businessStore.updateSupplier] id=",
      id,
      "patch=",
      patch,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    const current = getState().suppliers.find((s) => s.id === id) ?? null;

    setState({
      suppliers: getState().suppliers.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    });
    await flush();

    if (token && current?.businessId) {
      await tryApi(
        () =>
          suppliersApi.update(token, current.businessId, id, {
            name: patch.name ?? current.name,
            email: patch.email ?? current.email ?? null,
            phone: patch.phone ?? current.phone ?? null,
            address: null,
          }),
        "suppliersApi.update",
      );
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

    console.log(
      "[businessStore.deleteSupplier] id=",
      id,
      "businessId=",
      sup?.businessId,
      "tokenHead=",
      String(token ?? "").slice(0, 10),
    );

    setState({ suppliers: getState().suppliers.filter((s) => s.id !== id) });
    await flush();

    if (token && sup?.businessId) {
      await tryApi(
        () => suppliersApi.remove(token, sup.businessId, id),
        "suppliersApi.remove",
      );
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
