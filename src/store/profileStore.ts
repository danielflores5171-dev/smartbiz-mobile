// src/store/profileStore.ts
// TODO(web): cuando exista PATCH /api/me con Bearer token, este flujo dejará de caer a fallback demo.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useSyncExternalStore } from "react";

import { profileApi, type ApiProfileItem } from "@/src/api/profileApi";

export type ProfileStatus = "active" | "inactive";

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUri?: string;
  avatarUrl?: string;
  status: ProfileStatus;
  updatedAt: string;
};

type State = {
  profile: UserProfile;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  userKey: string | null;
};

const BASE_KEY = "smartbiz.profileStore.v2";

function buildStorageKey(userKey: string) {
  return `${BASE_KEY}:${userKey}`;
}

function normalizeEmail(email: string) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
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
    avatarUrl: undefined,
    status: "active",
    updatedAt: new Date().toISOString(),
  };
}

function mapApiProfileToLocal(
  item: ApiProfileItem,
  current?: UserProfile | null,
): UserProfile {
  const fullName =
    String(
      item?.full_name ?? current?.fullName ?? item?.email ?? "Usuario",
    ).trim() || "Usuario";

  const email = normalizeEmail(item?.email ?? current?.email ?? "");

  const statusRaw = String(item?.status ?? "")
    .toLowerCase()
    .trim();
  const status: ProfileStatus =
    statusRaw === "inactive" ? "inactive" : "active";

  return {
    id: String(item?.id ?? current?.id ?? ""),
    fullName,
    email,
    phone: item?.phone ? String(item.phone) : (current?.phone ?? ""),
    avatarUri: current?.avatarUri,
    avatarUrl: item?.photo_url ? String(item.photo_url) : current?.avatarUrl,
    status,
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

function getState() {
  return state;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function setState(patch: Partial<State>, opts?: { skipPersist?: boolean }) {
  Object.assign(state, patch);
  emit();
  if (!opts?.skipPersist) void persist();
}

async function persistNow() {
  const st = getState();
  if (!st.hydrated) return;
  if (!st.userKey) return;

  await AsyncStorage.setItem(
    buildStorageKey(st.userKey),
    JSON.stringify({ profile: st.profile }),
  );
}

async function persist() {
  const st = getState();
  if (!st.hydrated) return;
  if (!st.userKey) return;

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      await persistNow();
    } catch {
      // silencioso
    }
  }, 150);
}

async function flush() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  try {
    await persistNow();
  } catch {
    // silencioso
  }
}

async function hydrateForUser(userKey: string, fallbackProfile: UserProfile) {
  const raw = await AsyncStorage.getItem(buildStorageKey(userKey));

  if (!raw) {
    setState(
      {
        userKey,
        profile: fallbackProfile,
        hydrated: true,
        loading: false,
        error: null,
      },
      { skipPersist: true },
    );
    await persistNow();
    return;
  }

  try {
    const parsed = JSON.parse(raw) as any;
    setState(
      {
        userKey,
        profile: parsed?.profile ?? fallbackProfile,
        hydrated: true,
        loading: false,
        error: null,
      },
      { skipPersist: true },
    );
  } catch {
    setState(
      {
        userKey,
        profile: fallbackProfile,
        hydrated: true,
        loading: false,
        error: null,
      },
      { skipPersist: true },
    );
  }
}

async function tryApi<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T | null> {
  try {
    console.log(`[${label}] CALL`);
    return await fn();
  } catch (e) {
    console.log(`[${label}] FAIL -> fallback demo:`, String(e));
    return null;
  }
}

export const profileActions = {
  async bootstrap() {
    if (getState().hydrated) return;
    setState(
      {
        profile: DEFAULT_PROFILE,
        hydrated: true,
        loading: false,
        error: null,
        userKey: null,
      },
      { skipPersist: true },
    );
  },

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

    if (getState().hydrated && getState().userKey === userKey) {
      const current = getState().profile;
      setState({
        profile: {
          ...current,
          id: user.id,
          email: normalizeEmail(user.email),
          fullName: user.fullName?.trim() || current.fullName,
          updatedAt: new Date().toISOString(),
        },
      });
    } else {
      setState(
        {
          hydrated: false,
          loading: false,
          error: null,
          userKey,
        },
        { skipPersist: true },
      );
      await hydrateForUser(userKey, fallback);
    }

    if (token) {
      await this.syncFromApi(token);
    }
  },

  async syncFromApi(token: string) {
    setState({ loading: true, error: null });

    const apiRes = await tryApi(() => profileApi.me(token), "profileApi.me");
    const item = apiRes?.data?.user ?? null;

    if (item) {
      const current = getState().profile;
      const next = mapApiProfileToLocal(item, current);
      setState({
        profile: next,
        loading: false,
        error: null,
      });
      await flush();
      return next;
    }

    setState({ loading: false });
    return null;
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

  async updateProfile(
    patch: Partial<
      Pick<
        UserProfile,
        "fullName" | "email" | "phone" | "avatarUri" | "avatarUrl"
      >
    >,
    token?: string | null,
  ) {
    console.log(
      "[profileStore.updateProfile] tokenHead=",
      String(token ?? "").slice(0, 10),
      "patch=",
      patch,
    );

    setState({ loading: true, error: null });

    const current = getState().profile;
    const optimistic: UserProfile = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    setState({
      profile: optimistic,
      loading: false,
      error: null,
    });
    await flush();

    if (token) {
      const apiRes = await tryApi(
        () =>
          profileApi.update(token, {
            full_name: patch.fullName ?? current.fullName,
            email: patch.email ?? current.email,
            phone:
              patch.phone !== undefined
                ? patch.phone || null
                : current.phone || null,
            photo_url:
              patch.avatarUrl !== undefined
                ? patch.avatarUrl || null
                : current.avatarUrl || null,
          }),
        "profileApi.update",
      );

      const item = apiRes?.data?.user ?? null;
      if (item) {
        const merged = mapApiProfileToLocal(item, optimistic);
        setState({
          profile: {
            ...merged,
            avatarUri: optimistic.avatarUri,
          },
          loading: false,
          error: null,
        });
        await flush();
        return getState().profile;
      }
    } else {
      console.log("[profileStore.updateProfile] no token, skipping API");
    }

    console.log("[profileStore.updateProfile] fallback demo");
    return optimistic;
  },

  async setStatus(status: ProfileStatus) {
    return this.updateProfile({} as any, null);
  },

  async setAvatar(avatarUri?: string, token?: string | null) {
    return this.updateProfile({ avatarUri }, token);
  },

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
