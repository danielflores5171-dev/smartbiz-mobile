// src/store/authStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { authService, type AuthUser } from "../services/authService";

// ✅ limpiar memoria al cambiar/cerrar sesión
import { businessActions } from "./businessStore";
import { useDashboardWidgetsStore } from "./dashboardWidgetsStore";
import { inventoryActions } from "./inventoryStore";
import { notificationActions } from "./notificationStore";
import { salesActions } from "./salesStore";

type AuthState = {
  hydrated: boolean;
  token: string | null;
  user: AuthUser | null;

  // reset flow (no se persiste)
  resetEmail: string | null;
  resetDevCode: string | null; // solo DEV para probar
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
  // ✅ stores “por usuario”: limpiar memoria para que no se pegue nada
  businessActions.clearLocalMemoryOnly();

  // inventoryStore (tu archivo actual no traía clearLocalMemoryOnly)
  // => por ahora usamos bootstrap reset: si ya agregaste clearLocalMemoryOnly en inventoryStore, cámbialo aquí.
  inventoryActions.clearLocalMemoryOnly?.();

  // notificationStore (según tu archivo: clearLocal)
  notificationActions.clearLocal();

  // salesStore (según tu archivo: clearLocal)
  salesActions.clearLocal();

  // dashboard widgets (según tu archivo: clearLocalMemoryOnly)
  useDashboardWidgetsStore.getState().clearLocalMemoryOnly();
}

async function persistSafe() {
  try {
    if (!getState().hydrated) return;

    const payload = {
      token: getState().token,
      user: getState().user,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // demo: silencioso
  }
}

async function hydrate() {
  let raw: string | null = null;

  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    setState(
      { hydrated: true, token: null, user: null },
      { skipPersist: true },
    );
    return;
  }

  if (!raw) {
    setState(
      { hydrated: true, token: null, user: null },
      { skipPersist: true },
    );
    return;
  }

  try {
    const parsed = JSON.parse(raw) as any;

    setState(
      {
        hydrated: true,
        token: parsed?.token ?? null,
        user: parsed?.user ?? null,
      },
      { skipPersist: true },
    );
  } catch {
    setState(
      { hydrated: true, token: null, user: null },
      { skipPersist: true },
    );
  }
}

export const authActions = {
  async bootstrap() {
    if (getState().hydrated) return;
    await hydrate();
  },

  async login(email: string, password: string) {
    // ✅ evita “pegado” si cambias de usuario sin cerrar bien
    clearAllLocalMemory();

    const session = await authService.login(email, password);
    setState({ token: session.token, user: session.user });
    return session;
  },

  async register(email: string, password: string, fullName?: string) {
    // ✅ por consistencia: limpiamos antes
    clearAllLocalMemory();

    const session = await authService.register(email, password, fullName);
    setState({ token: session.token, user: session.user });
    return session;
  },

  async logout() {
    // ✅ limpia memoria para evitar “pegado” entre usuarios
    clearAllLocalMemory();

    // 1) limpia memoria inmediato (auth)
    setState({ token: null, user: null }, { skipPersist: true });

    // 2) limpia storage (auth)
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // demo
    }

    // 3) service
    try {
      await authService.logout();
    } catch {
      // demo
    }
  },

  // -------- RESET FLOW --------
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
