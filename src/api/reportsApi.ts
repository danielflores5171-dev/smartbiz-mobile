import { get } from "./http";

export const reportsApi = {
  inventory: (token: string) => get<any>("/api/reports/inventory", token),
  sales: (token: string) => get<any>("/api/reports/sales", token),
  salesCsv: (token: string) =>
    get<any>("/api/reports/exports/sales.csv", token),
};
