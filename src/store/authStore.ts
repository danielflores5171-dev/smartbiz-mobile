// src/store/authStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { authService, type AuthUser } from "../services/authService";

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

function setState(patch: Partial<AuthState>, opts?: { skipPersist?: boolean }) {
  state = { ...state, ...patch };
  emit();

  // ✅ Solo persistimos cuando ya hidrató y no nos pidieron saltarlo
  if (!opts?.skipPersist) void persist();
}

async function persist() {
  if (!state.hydrated) return;

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: state.token,
      user: state.user,
    }),
  );
}

async function hydrate() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    // ✅ No hay sesión guardada
    setState({ hydrated: true }, { skipPersist: true });
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    setState(
      {
        hydrated: true,
        token: parsed.token ?? null,
        user: parsed.user ?? null,
      },
      { skipPersist: true }, // ✅ importante: no re-escribir lo mismo al cargar
    );
  } catch {
    // ✅ Storage corrupto: marca hidratado sin re-persistir
    setState(
      { hydrated: true, token: null, user: null },
      { skipPersist: true },
    );
  }
}

export const authActions = {
  async bootstrap() {
    if (state.hydrated) return;
    await hydrate();
  },

  async login(email: string, password: string) {
    const session = await authService.login(email, password);
    setState({ token: session.token, user: session.user });
  },

  async register(email: string, password: string, fullName?: string) {
    const session = await authService.register(email, password, fullName);
    setState({ token: session.token, user: session.user });
  },

  async logout() {
    // ✅ 1) limpia el estado en memoria (UI consistente inmediato)
    setState({ token: null, user: null }, { skipPersist: true });

    // ✅ 2) limpia storage solo de auth
    await AsyncStorage.removeItem(STORAGE_KEY);

    // ✅ 3) opcional: service
    await authService.logout();
  },

  // -------- RESET FLOW --------
  async requestPasswordReset(email: string) {
    const out = await authService.requestPasswordReset(email);
    setState({
      resetEmail: email.trim().toLowerCase(),
      resetDevCode: out.devCode ?? null,
    });
    return out;
  },

  async resendPasswordReset(email: string) {
    return await this.requestPasswordReset(email);
  },

  async verifyResetCode(email: string, code: string) {
    await authService.verifyResetCode(email, code);
    setState({ resetEmail: email.trim().toLowerCase() });
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
    () => selector(state),
    () => selector(state),
  );
}
