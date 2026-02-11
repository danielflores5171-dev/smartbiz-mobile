// src/services/businessService.ts
import type { Business, Employee, ID, Supplier } from "../types/business";

const uid = () => Math.random().toString(36).slice(2, 10);

export const businessService = {
  // Businesses (mock)
  async listBusinesses(): Promise<Business[]> {
    // En modo demo, el store manda (AsyncStorage). Aquí retornamos vacío.
    return [];
  },

  async createBusiness(
    input: Omit<Business, "id" | "createdAt">,
  ): Promise<Business> {
    return {
      id: `biz-${uid()}`,
      createdAt: new Date().toISOString(),
      ...input,
    };
  },

  async updateBusiness(id: ID, patch: Partial<Business>): Promise<Business> {
    // No “not found” en demo
    return {
      id,
      name: patch.name ?? "",
      legalName: patch.legalName,
      phone: patch.phone,
      email: patch.email,
      address: patch.address,
      createdAt: patch.createdAt ?? new Date().toISOString(),
    };
  },

  async deleteBusiness(_id: ID): Promise<void> {
    return;
  },

  // Employees (mock)
  async listEmployees(_businessId: ID): Promise<Employee[]> {
    return [];
  },

  async createEmployee(
    input: Pick<Employee, "businessId" | "fullName" | "role" | "status">,
  ): Promise<Employee> {
    return {
      id: `emp-${uid()}`,
      email: "",
      createdAt: new Date().toISOString(),
      ...input,
    };
  },

  // Suppliers (mock)
  async listSuppliers(_businessId: ID): Promise<Supplier[]> {
    return [];
  },

  async createSupplier(
    input: Omit<Supplier, "id" | "createdAt">,
  ): Promise<Supplier> {
    return {
      id: `sup-${uid()}`,
      createdAt: new Date().toISOString(),
      ...input,
    };
  },

  async updateSupplier(id: ID, patch: Partial<Supplier>): Promise<Supplier> {
    // No “not found” en demo
    return {
      id,
      businessId: patch.businessId ?? "",
      name: patch.name ?? "",
      contactName: patch.contactName,
      phone: patch.phone,
      email: patch.email,
      notes: patch.notes,
      createdAt: patch.createdAt ?? new Date().toISOString(),
    };
  },

  async deleteSupplier(_id: ID): Promise<void> {
    return;
  },
};
