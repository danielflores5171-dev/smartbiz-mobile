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

// ✅ NUEVO: token seguro (SecureStore)
import { clearToken, getToken, saveToken } from "./sessionStore";

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
  inventoryActions.clearLocalMemoryOnly?.();
  notificationActions.clearLocal();
  salesActions.clearLocal();
  useDashboardWidgetsStore.getState().clearLocalMemoryOnly();
}

async function persistSafe() {
  try {
    if (!getState().hydrated) return;

    // ✅ Guardamos SOLO el user en AsyncStorage
    // (token se guarda en SecureStore)
    const payload = {
      user: getState().user,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // demo: silencioso
  }
}

async function hydrate() {
  // 1) Token desde SecureStore
  let token: string | null = null;
  try {
    token = await getToken();
  } catch {
    token = null;
  }

  // 2) User desde AsyncStorage
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (!raw) {
    setState({ hydrated: true, token, user: null }, { skipPersist: true });
    return;
  }

  try {
    const parsed = JSON.parse(raw) as any;
    setState(
      {
        hydrated: true,
        token,
        user: parsed?.user ?? null,
      },
      { skipPersist: true },
    );
  } catch {
    setState({ hydrated: true, token, user: null }, { skipPersist: true });
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

    // ✅ guarda token seguro
    if (session.token) {
      try {
        await saveToken(session.token);
      } catch {
        // si falla SecureStore, igual seguimos (pero token no persistirá)
      }
    }

    setState({ token: session.token, user: session.user });
    return session;
  },

  async register(email: string, password: string, fullName?: string) {
    clearAllLocalMemory();

    const session = await authService.register(email, password, fullName);

    // ✅ guarda token seguro
    if (session.token) {
      try {
        await saveToken(session.token);
      } catch {
        // ignore
      }
    }

    setState({ token: session.token, user: session.user });
    return session;
  },

  async logout() {
    clearAllLocalMemory();

    // 1) limpia memoria inmediato (auth)
    setState({ token: null, user: null }, { skipPersist: true });

    // 2) limpia AsyncStorage (solo user)
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // demo
    }

    // 3) limpia SecureStore (token)
    try {
      await clearToken();
    } catch {
      // demo
    }

    // 4) service
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
