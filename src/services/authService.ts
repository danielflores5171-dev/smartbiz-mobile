// src/services/authService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type StoredUser = AuthUser & {
  password: string; // demo
};

const USERS_KEY = "smartbiz.users";
const RESET_KEY = "smartbiz.resetCodes";

// ✅ CAMBIA ESTO A false cuando conectes backend real
const DEMO_SHOW_RESET_CODE = true;

// helpers
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
function genCode6() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
}

async function readUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}
async function writeUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

type ResetRecord = { code: string; expiresAt: number };
async function readResetMap(): Promise<Record<string, ResetRecord>> {
  const raw = await AsyncStorage.getItem(RESET_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, ResetRecord>;
  } catch {
    return {};
  }
}
async function writeResetMap(map: Record<string, ResetRecord>) {
  await AsyncStorage.setItem(RESET_KEY, JSON.stringify(map));
}

export const authService = {
  async register(
    email: string,
    password: string,
    fullName?: string,
  ): Promise<AuthSession> {
    const e = normalizeEmail(email);
    const users = await readUsers();

    const exists = users.some((u) => u.email === e);
    if (exists) {
      throw new Error("Ese correo ya está registrado.");
    }

    const user: StoredUser = {
      id: uid(),
      email: e,
      fullName,
      password,
    };

    users.push(user);
    await writeUsers(users);

    return {
      token: "demo-" + uid(),
      user: { id: user.id, email: user.email, fullName: user.fullName },
    };
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const e = normalizeEmail(email);
    const users = await readUsers();
    const u = users.find((x) => x.email === e);

    if (!u || u.password !== password) {
      throw new Error("Credenciales inválidas.");
    }

    return {
      token: "demo-" + uid(),
      user: { id: u.id, email: u.email, fullName: u.fullName },
    };
  },

  async logout(): Promise<void> {
    // demo: no-op
  },

  // -------- RESET FLOW (demo) --------
  async requestPasswordReset(email: string): Promise<{ devCode?: string }> {
    const e = normalizeEmail(email);

    // ✅ UX: no revelamos si existe o no
    const map = await readResetMap();
    const code = genCode6();

    map[e] = { code, expiresAt: Date.now() + 15 * 60 * 1000 }; // 15 min
    await writeResetMap(map);

    // ✅ SOLUCIÓN DEFINITIVA: en demo SIEMPRE devolvemos el código (según flag)
    return DEMO_SHOW_RESET_CODE ? { devCode: code } : {};
  },

  async verifyResetCode(email: string, code: string): Promise<void> {
    const e = normalizeEmail(email);
    const c = code.trim();
    const map = await readResetMap();
    const rec = map[e];

    if (!rec) throw new Error("No hay un código activo para ese correo.");
    if (Date.now() > rec.expiresAt)
      throw new Error("El código expiró. Reenvíalo.");
    if (rec.code !== c) throw new Error("Código incorrecto.");
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const e = normalizeEmail(email);
    await this.verifyResetCode(e, code);

    const users = await readUsers();
    const idx = users.findIndex((u) => u.email === e);
    if (idx === -1) {
      throw new Error("No se pudo actualizar la contraseña.");
    }

    users[idx] = { ...users[idx], password: newPassword };
    await writeUsers(users);

    const map = await readResetMap();
    delete map[e];
    await writeResetMap(map);
  },
};
