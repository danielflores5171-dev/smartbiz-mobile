// src/types/business.ts

// ID base para todo
export type ID = string;

// ----- Business -----

export type BusinessStatus = "active" | "inactive";

export type Business = {
  id: ID;
  name: string;
  legalName?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: BusinessStatus; // ✅ agrega esto
  createdAt: string;
};

// ----- Employees -----
export type EmployeeRole = "ADMIN" | "MANAGER" | "CASHIER" | "STAFF";
export type EmployeeStatus = "active" | "inactive";

export type Employee = {
  id: ID;
  businessId: ID;
  fullName: string;
  email?: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  createdAt: string;
};

// ----- Suppliers -----
export type Supplier = {
  id: ID;
  businessId: ID;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
};
