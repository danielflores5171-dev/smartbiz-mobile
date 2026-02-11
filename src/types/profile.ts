// src/types/profile.ts
import type { ID } from "./business";

export type UserProfile = {
  id: ID;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string; // luego: imagen real
  createdAt: string;
  updatedAt: string;
};

export type ProfileSettings = {
  marketingEmails: boolean;
  pushNotifications: boolean;
  lowStockAlerts: boolean;
};

export type UserSession = {
  id: ID;
  deviceName: string;
  platform: "android" | "ios" | "web" | "unknown";
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
};
