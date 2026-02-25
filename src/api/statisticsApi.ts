import { get } from "./http";

export const statisticsApi = {
  summary: (token: string) => get<any>("/api/statistics/summary", token),
  series: (token: string) => get<any>("/api/statistics/series", token),
};
