// src/services/authService.ts
import { ENV } from "@/src/lib/env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
};

export type AuthSession = {
  token: string; // ✅ Supabase access_token (JWT)
  user: AuthUser;
};

// ------------------------
// Supabase client (singleton)
// ------------------------
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = String(ENV.SUPABASE_URL ?? "").trim();
  const anon = String(ENV.SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !anon) {
    throw new Error(
      "Faltan variables de Supabase. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en tu .env y reinicia Expo con -c.",
    );
  }

  _supabase = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return _supabase;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function extractFullName(user: any): string | undefined {
  const md = user?.user_metadata ?? {};
  return (
    (typeof md.full_name === "string" && md.full_name.trim()) ||
    (typeof md.name === "string" && md.name.trim()) ||
    undefined
  );
}

function toAuthUser(user: any): AuthUser {
  return {
    id: String(user.id),
    email: String(user.email ?? ""),
    fullName: extractFullName(user),
  };
}

function mapSupabaseError(e: any): string {
  const msg = String(e?.message ?? e ?? "Error");

  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials"))
    return "Credenciales inválidas.";
  if (lower.includes("email not confirmed") || lower.includes("not confirmed"))
    return "Debes confirmar tu correo antes de iniciar sesión.";
  if (lower.includes("already registered") || lower.includes("already exists"))
    return "Ese correo ya está registrado.";
  if (lower.includes("too many") || lower.includes("rate limit"))
    return "Demasiados intentos. Intenta de nuevo en unos minutos.";

  return msg;
}

export const authService = {
  /**
   * ✅ Registro real en Supabase
   * Guarda fullName en user_metadata.full_name
   */
  async register(
    email: string,
    password: string,
    fullName?: string,
  ): Promise<AuthSession> {
    const supabase = getSupabase();
    const e = normalizeEmail(email);

    const { data, error } = await supabase.auth.signUp({
      email: e,
      password,
      options: {
        data: {
          full_name: fullName?.trim() || undefined,
        },
      },
    });

    if (error) throw new Error(mapSupabaseError(error));

    // Puede que session venga null si Supabase requiere confirmación por correo
    const session = data.session;
    const user = data.user;

    if (!user) throw new Error("No se pudo crear el usuario.");

    if (!session?.access_token) {
      // Si requiere confirmación, no hay token todavía
      throw new Error(
        "Registro exitoso. Confirma tu correo para iniciar sesión.",
      );
    }

    return {
      token: session.access_token,
      user: toAuthUser(user),
    };
  },

  /**
   * ✅ Login real en Supabase
   */
  async login(email: string, password: string): Promise<AuthSession> {
    const supabase = getSupabase();
    const e = normalizeEmail(email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: e,
      password,
    });

    if (error) throw new Error(mapSupabaseError(error));

    const session = data.session;
    const user = data.user;

    if (!session?.access_token) {
      throw new Error("No se pudo obtener token de sesión.");
    }
    if (!user) {
      throw new Error("No se pudo obtener usuario.");
    }

    return {
      token: session.access_token,
      user: toAuthUser(user),
    };
  },

  /**
   * ✅ Logout real en Supabase
   */
  async logout(): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
      // No bloqueamos logout por errores raros
      console.warn("[authService.logout] supabase error:", error);
    }
  },

  // -------- RESET FLOW (Supabase) --------
  /**
   * ✅ En Supabase el reset se hace por correo (link)
   * Tu UI puede seguir mostrando "te enviamos correo".
   */
  async requestPasswordReset(email: string): Promise<{ devCode?: string }> {
    const supabase = getSupabase();
    const e = normalizeEmail(email);

    const { error } = await supabase.auth.resetPasswordForEmail(e);
    if (error) throw new Error(mapSupabaseError(error));

    // No hay devCode en producción
    return {};
  },

  /**
   * En Supabase, la verificación del código y el cambio de password
   * normalmente pasan por un link de email (deep link).
   * Aquí dejamos mensajes claros para tu UI.
   */
  async verifyResetCode(_email: string, _code: string): Promise<void> {
    throw new Error(
      "En Supabase la recuperación se confirma desde el enlace enviado a tu correo.",
    );
  },

  async resetPassword(
    _email: string,
    _code: string,
    _newPassword: string,
  ): Promise<void> {
    throw new Error(
      "En Supabase la contraseña se cambia desde el enlace enviado a tu correo.",
    );
  },
};
