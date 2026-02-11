// src/services/profileService.ts
import type {
    ProfileSettings,
    UserProfile,
    UserSession,
} from "../types/profile";

const uid = () => Math.random().toString(36).slice(2, 10);

let demoProfile: UserProfile | null = null;
let demoSettings: ProfileSettings | null = null;
let demoSessions: UserSession[] = [];

export const profileService = {
  async getMe(): Promise<UserProfile> {
    if (!demoProfile) {
      demoProfile = {
        id: `usr-${uid()}`,
        fullName: "Andrés López",
        email: "andres@demo.com",
        phone: "",
        avatarUrl: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return demoProfile;
  },

  async updateMe(patch: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getMe();
    demoProfile = { ...current, ...patch, updatedAt: new Date().toISOString() };
    return demoProfile;
  },

  async getSettings(): Promise<ProfileSettings> {
    if (!demoSettings) {
      demoSettings = {
        marketingEmails: false,
        pushNotifications: true,
        lowStockAlerts: true,
      };
    }
    return demoSettings;
  },

  async updateSettings(
    patch: Partial<ProfileSettings>,
  ): Promise<ProfileSettings> {
    const current = await this.getSettings();
    demoSettings = { ...current, ...patch };
    return demoSettings;
  },

  async listSessions(): Promise<UserSession[]> {
    if (demoSessions.length === 0) {
      demoSessions = [
        {
          id: `ses-${uid()}`,
          deviceName: "Xiaomi 6 Pro",
          platform: "android",
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          isCurrent: true,
        },
        {
          id: `ses-${uid()}`,
          deviceName: "Chrome (Desktop)",
          platform: "web",
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          isCurrent: false,
        },
      ];
    }
    return demoSessions;
  },

  async revokeSession(sessionId: string): Promise<void> {
    demoSessions = demoSessions.filter((s) => s.id !== sessionId);
  },

  async changePassword(_current: string, _next: string): Promise<void> {
    // demo: aquí solo “simulamos” éxito
    return;
  },
};
