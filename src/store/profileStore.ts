// src/store/profileStore.ts
import { apiRequest } from "@/src/lib/apiClient";
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
  userKey: string | null;
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

function setState(patch: Partial<State>, opts?: { skipPersist?: boolean }) {
  Object.assign(state, patch);
  emit();
  if (!opts?.skipPersist) void persist();
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
  async bootstrap() {
    if (getState().hydrated) return;
    setState(
      {
        hydrated: true,
        loading: false,
        error: null,
        userKey: null,
        profile: DEFAULT_PROFILE,
      },
      { skipPersist: true },
    );
  },

  /**
   * ✅ Se llama cuando ya hay sesión.
   * Mantiene el perfil local por usuario y (opcional) puede sincronizar desde API con token.
   */
  async bootstrapForAuthUser(
    user: { id: string; email: string; fullName?: string } | null,
    token?: string | null,
  ) {
    if (!user) {
      setState(
        {
          userKey: null,
          profile: DEFAULT_PROFILE,
          hydrated: true,
          loading: false,
          error: null,
        },
        { skipPersist: true },
      );
      return;
    }

    const userKey = user.id || normalizeEmail(user.email);
    const fallback = makeProfileFromAuth(user);

    // Si ya está hidratado para el mismo usuario, sync suave
    if (getState().hydrated && getState().userKey === userKey) {
      const current = getState().profile;
      const next: UserProfile = {
        ...current,
        id: user.id,
        email: normalizeEmail(user.email),
        fullName: user.fullName?.trim() || current.fullName,
        updatedAt: new Date().toISOString(),
      };
      setState({ profile: next });
    } else {
      setState(
        { hydrated: false, loading: false, error: null, userKey },
        { skipPersist: true },
      );
      await hydrateForUser(userKey, fallback);
    }

    // ✅ Sync remoto opcional (Supabase-only): /api/auth/me
    if (token) {
      await this.syncFromApi(token);
    }
  },

  /**
   * ✅ Sync remoto mínimo (no depende de Cockroach)
   * Web: GET /api/auth/me
   */
  async syncFromApi(token: string) {
    setState({ loading: true, error: null });

    try {
      const res = await apiRequest<{
        user: { id: string; email: string | null };
      }>("/api/auth/me", { method: "GET", token });

      const u = res.data.user;

      // Sync suave: no pisa avatar/phone
      const current = getState().profile;
      const next: UserProfile = {
        ...current,
        id: u.id,
        email: u.email ? normalizeEmail(u.email) : current.email,
        updatedAt: new Date().toISOString(),
      };

      setState({ profile: next, loading: false, error: null });
      return next;
    } catch (e: any) {
      setState({
        loading: false,
        error: e?.message ?? "No se pudo sincronizar perfil.",
      });
      return null;
    }
  },

  resetLocal() {
    setState(
      {
        userKey: null,
        profile: DEFAULT_PROFILE,
        hydrated: true,
        loading: false,
        error: null,
      },
      { skipPersist: true },
    );
  },

  getProfile() {
    return getState().profile;
  },

  async updateProfile(patch: Partial<Omit<UserProfile, "id">>) {
    // local-only por ahora
    setState({ loading: true, error: null });
    const next: UserProfile = {
      ...getState().profile,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setState({ profile: next, loading: false, error: null });
    return next;
  },

  async setStatus(status: ProfileStatus) {
    return this.updateProfile({ status });
  },

  async setAvatar(avatarUri?: string) {
    return this.updateProfile({ avatarUri });
  },

  /**
   * Password real depende de Supabase (SDK) o endpoint dedicado.
   * Lo dejamos demo por ahora.
   */
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
