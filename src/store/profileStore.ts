// src/store/profileStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";

export type ProfileStatus = "active" | "inactive";

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUri?: string;
  status: ProfileStatus;
  updatedAt: string;
};

type State = {
  profile: UserProfile;
  hydrated: boolean;
  loading: boolean;
  error: string | null;

  // ✅ para poder “re-hidratar” por usuario
  userKey: string | null; // ej: user.id o email normalizado
};

const BASE_KEY = "smartbiz.profileStore.v1";

function buildStorageKey(userKey: string) {
  return `${BASE_KEY}:${userKey}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function makeProfileFromAuth(params: {
  id?: string;
  email?: string;
  fullName?: string;
}): UserProfile {
  const email = params.email
    ? normalizeEmail(params.email)
    : "andres@smartbiz.demo";
  const id = params.id ?? `demo-${email}`;
  const fullName = params.fullName?.trim() || "Usuario";

  return {
    id,
    fullName,
    email,
    phone: "",
    avatarUri: undefined,
    status: "active",
    updatedAt: new Date().toISOString(),
  };
}

// 👇 Perfil default (solo para cuando no hay sesión)
const DEFAULT_PROFILE: UserProfile = makeProfileFromAuth({
  id: "demo-user",
  email: "andres@smartbiz.demo",
  fullName: "Andrés López",
});

const state: State = {
  profile: DEFAULT_PROFILE,
  hydrated: false,
  loading: false,
  error: null,
  userKey: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setState(patch: Partial<State>) {
  Object.assign(state, patch);
  emit();
  void persist();
}

function getState() {
  return state;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function persist() {
  const st = getState();
  if (!st.hydrated) return;
  if (!st.userKey) return;

  if (persistTimer) clearTimeout(persistTimer);

  persistTimer = setTimeout(async () => {
    const key = buildStorageKey(st.userKey!);
    await AsyncStorage.setItem(key, JSON.stringify({ profile: st.profile }));
  }, 150);
}

async function hydrateForUser(userKey: string, fallbackProfile: UserProfile) {
  const key = buildStorageKey(userKey);

  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    Object.assign(state, {
      userKey,
      profile: fallbackProfile,
      hydrated: true,
      loading: false,
      error: null,
    });
    emit();
    await AsyncStorage.setItem(key, JSON.stringify({ profile: state.profile }));
    return;
  }

  try {
    const parsed = JSON.parse(raw) as any;
    Object.assign(state, {
      userKey,
      profile: parsed?.profile ?? fallbackProfile,
      hydrated: true,
      loading: false,
      error: null,
    });
    emit();
  } catch {
    Object.assign(state, {
      userKey,
      profile: fallbackProfile,
      hydrated: true,
      loading: false,
      error: null,
    });
    emit();
  }
}

export const profileActions = {
  /**
   * ✅ Compatibilidad: si alguien lo llama sin sesión,
   * deja el store hidratado con DEFAULT_PROFILE.
   * (Esto evita errores en pantallas que todavía lo usen.)
   */
  async bootstrap() {
    if (getState().hydrated) return;
    setState({
      hydrated: true,
      loading: false,
      error: null,
      userKey: null,
      profile: DEFAULT_PROFILE,
    });
  },

  /**
   * ✅ Se llama cuando YA hay sesión.
   * Esto fuerza a que el perfil pertenezca al usuario autenticado (id/email).
   */
  async bootstrapForAuthUser(
    user: { id: string; email: string; fullName?: string } | null,
  ) {
    if (!user) {
      // sin sesión
      setState({
        userKey: null,
        profile: DEFAULT_PROFILE,
        hydrated: true,
        loading: false,
        error: null,
      });
      return;
    }

    const userKey = user.id || normalizeEmail(user.email);
    const fallback = makeProfileFromAuth(user);

    // Si ya está hidratado para este mismo usuario, solo sincroniza campos básicos
    if (getState().hydrated && getState().userKey === userKey) {
      // sync suave (no pisa avatar/phone si ya los tiene)
      const current = getState().profile;
      const next: UserProfile = {
        ...current,
        id: user.id,
        email: normalizeEmail(user.email),
        fullName: user.fullName?.trim() || current.fullName,
        updatedAt: new Date().toISOString(),
      };
      setState({ profile: next });
      return;
    }

    // Si cambió el usuario, re-hidrata desde storage de ESE usuario
    setState({ hydrated: false, loading: false, error: null, userKey });
    await hydrateForUser(userKey, fallback);
  },

  // ✅ útil en logout: limpia UI y vuelve a default (no borra el storage histórico)
  resetLocal() {
    setState({
      userKey: null,
      profile: DEFAULT_PROFILE,
      hydrated: true,
      loading: false,
      error: null,
    });
  },

  // ✅ “GET” demo
  getProfile() {
    return getState().profile;
  },

  // ✅ “POST/PATCH” demo
  async updateProfile(patch: Partial<Omit<UserProfile, "id">>) {
    setState({ loading: true, error: null });
    const next: UserProfile = {
      ...getState().profile,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setState({ profile: next, loading: false });
    return next;
  },

  async setStatus(status: ProfileStatus) {
    return this.updateProfile({ status });
  },

  async setAvatar(avatarUri?: string) {
    return this.updateProfile({ avatarUri });
  },

  // ✅ “POST” demo: cambiar contraseña (solo frontend)
  async changePassword(params: {
    currentPassword: string;
    newPassword: string;
  }) {
    const { currentPassword, newPassword } = params;

    setState({ loading: true, error: null });

    if (!currentPassword.trim() || !newPassword.trim()) {
      setState({ loading: false, error: "Campos incompletos" });
      throw new Error("Campos incompletos");
    }

    if (newPassword.trim().length < 6) {
      setState({
        loading: false,
        error: "La nueva contraseña debe tener al menos 6 caracteres",
      });
      throw new Error("Contraseña muy corta");
    }

    if (currentPassword.trim() !== "123456") {
      setState({
        loading: false,
        error: "Contraseña actual incorrecta (demo)",
      });
      throw new Error("Contraseña actual incorrecta (demo)");
    }

    setState({ loading: false, error: null });
    return true;
  },
};

export function useProfileStore<T>(selector: (s: State) => T): T {
  const snap = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(getState()),
    () => selector(getState()),
  );

  return useMemo(() => snap, [snap]);
}
