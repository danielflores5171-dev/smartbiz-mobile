import { get } from "./http";

export const dashboardApi = {
  home: (token: string) => get<any>("/api/dashboard/home", token),
  summary: (token: string) => get<any>("/api/dashboard/summary", token),
};
