// src/store/authStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { authService, type AuthUser } from "../services/authService";

// ✅ limpiar memoria al cambiar/cerrar sesión
import { businessActions } from "./businessStore";
import { dashboardActions } from "./dashboardStore";
import { useDashboardWidgetsStore } from "./dashboardWidgetsStore";
import { inventoryActions } from "./inventoryStore";
import { notificationActions } from "./notificationStore";
import { salesActions } from "./salesStore";

// ✅ token seguro
import { clearToken, getToken, saveToken } from "./sessionStore";

// ✅ para reparar user desde backend
import { apiRequest } from "@/src/lib/apiClient";

type AuthState = {
  hydrated: boolean;
  token: string | null;
  user: AuthUser | null;

  resetEmail: string | null;
  resetDevCode: string | null;
};

const STORAGE_KEY = "smartbiz.auth";

let state: AuthState = {
  hydrated: false,
  token: null,
  user: null,
  resetEmail: null,
  resetDevCode: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function getState() {
  return state;
}

function setState(patch: Partial<AuthState>, opts?: { skipPersist?: boolean }) {
  state = { ...state, ...patch };
  emit();
  if (!opts?.skipPersist) void persistSafe();
}

function clearAllLocalMemory() {
  businessActions.clearLocalMemoryOnly();
  dashboardActions.clearLocalMemoryOnly();
  inventoryActions.clearLocalMemoryOnly?.();
  notificationActions.clearLocal();
  salesActions.clearLocal();
  useDashboardWidgetsStore.getState().clearLocalMemoryOnly();
}

async function persistSafe() {
  try {
    if (!getState().hydrated) return;

    const payload = {
      user: getState().user,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // silencioso
  }
}

function normalizeUser(input: any): AuthUser | null {
  if (!input) return null;

  const id =
    input?.id ?? input?.user?.id ?? input?.userId ?? input?.user_id ?? null;

  const email = input?.email ?? input?.user?.email ?? null;

  if (!id) return null;

  return {
    ...input,
    id,
    email,
  } as AuthUser;
}

async function fetchUserFromApi(token: string): Promise<AuthUser | null> {
  try {
    const res = await apiRequest<{
      user: { id: string; email: string | null };
    }>("/api/auth/me", { token });

    const u = res?.data?.user;
    if (!u?.id) return null;

    return {
      id: u.id,
      email: u.email,
    } as AuthUser;
  } catch (e) {
    console.log("[authStore.fetchUserFromApi] FAIL:", String(e));
    return null;
  }
}

async function hydrate() {
  let token: string | null = null;
  try {
    token = await getToken();
  } catch {
    token = null;
  }

  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  let user: AuthUser | null = null;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as any;
      user = normalizeUser(parsed?.user);
    } catch {
      user = null;
    }
  }

  if (token && !user) {
    console.log(
      "[authStore.hydrate] token existe pero user no; intentando /api/auth/me...",
    );
    user = await fetchUserFromApi(token);
  }

  setState(
    {
      hydrated: true,
      token,
      user,
    },
    { skipPersist: true },
  );
}

export const authActions = {
  async bootstrap() {
    if (getState().hydrated) return;
    await hydrate();
  },

  async login(email: string, password: string) {
    clearAllLocalMemory();

    const session = await authService.login(email, password);

    if (session.token) {
      try {
        await saveToken(session.token);
      } catch {
        // ignore
      }
    }

    let user = normalizeUser(session.user);

    if (session.token && !user) {
      console.log(
        "[authStore.login] session.user inválido; intentando /api/auth/me...",
      );
      user = await fetchUserFromApi(session.token);
    }

    console.log(
      "[authStore.login] final userId=",
      user?.id,
      "tokenHead=",
      String(session.token ?? "").slice(0, 10),
    );

    setState({
      token: session.token,
      user,
      hydrated: true,
    });

    return {
      ...session,
      user,
    };
  },

  async register(email: string, password: string, fullName?: string) {
    clearAllLocalMemory();

    const session = await authService.register(email, password, fullName);

    if (session.token) {
      try {
        await saveToken(session.token);
      } catch {
        // ignore
      }
    }

    let user = normalizeUser(session.user);

    if (session.token && !user) {
      console.log(
        "[authStore.register] session.user inválido; intentando /api/auth/me...",
      );
      user = await fetchUserFromApi(session.token);
    }

    setState({
      token: session.token,
      user,
      hydrated: true,
    });

    return {
      ...session,
      user,
    };
  },

  async logout() {
    clearAllLocalMemory();

    setState({ token: null, user: null }, { skipPersist: true });

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    try {
      await clearToken();
    } catch {
      // ignore
    }

    try {
      await authService.logout();
    } catch {
      // ignore
    }
  },

  async requestPasswordReset(email: string) {
    const out = await authService.requestPasswordReset(email);
    setState({
      resetEmail: String(email ?? "")
        .trim()
        .toLowerCase(),
      resetDevCode: out.devCode ?? null,
    });
    return out;
  },

  async resendPasswordReset(email: string) {
    return await this.requestPasswordReset(email);
  },

  async verifyResetCode(email: string, code: string) {
    await authService.verifyResetCode(email, code);
    setState({
      resetEmail: String(email ?? "")
        .trim()
        .toLowerCase(),
    });
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    await authService.resetPassword(email, code, newPassword);
    setState({ resetEmail: null, resetDevCode: null });
  },

  clearResetDraft() {
    setState({ resetEmail: null, resetDevCode: null });
  },
};

export function useAuthStore<T>(selector: (s: AuthState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(getState()),
    () => selector(getState()),
  );
}
