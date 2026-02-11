// app/(tabs)/settings/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";
import AppButton from "@/src/ui/AppButton";
import Screen from "@/src/ui/Screen";

import {
  settingsActions,
  useSettingsStore,
  type CurrencyCode,
  type DateFormat,
  type LocaleCode,
  type ThemeMode as StoreThemeMode,
  type TimezoneCode,
} from "@/src/store/settingsStore";

function OptionPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: active ? colors.pillBgActive : colors.pillBg,
      }}
    >
      <Text
        style={{
          color: active ? colors.text : colors.muted,
          fontWeight: "900",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Card({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        marginTop: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            // ✅ FIX LIGHT: nada hardcodeado, usa token
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.divider,
          marginVertical: 14,
        }}
      />

      {children}
    </View>
  );
}

function NavRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card2,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.icon} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "900" }}>{title}</Text>
        {subtitle ? (
          <Text style={{ color: colors.muted, marginTop: 2, fontSize: 12 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function SettingsIndex() {
  const router = useRouter();
  const { mode, setMode, colors } = useTheme();

  const hydrated = useSettingsStore((s) => s.hydrated);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const currency = useSettingsStore((s) => s.currency);
  const taxRate = useSettingsStore((s) => s.taxRate);
  const locale = useSettingsStore((s) => s.locale);
  const dateFormat = useSettingsStore((s) => s.dateFormat);
  const timezone = useSettingsStore((s) => s.timezone);
  const systemNotifications = useSettingsStore((s) => s.systemNotifications);

  useEffect(() => {
    void settingsActions.bootstrap();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const safe: StoreThemeMode =
      themeMode === "light" || themeMode === "dark" || themeMode === "normal"
        ? themeMode
        : "normal";

    if (safe !== mode) setMode(safe);
  }, [hydrated, themeMode, mode, setMode]);

  const setThemeChoice = (m: StoreThemeMode) => {
    settingsActions.setThemeMode(m);
    setMode(m);
  };

  const setCurrencyChoice = (c: CurrencyCode) => settingsActions.setCurrency(c);
  const setLocaleChoice = (l: LocaleCode) => settingsActions.setLocale(l);
  const setTimezoneChoice = (tz: TimezoneCode) =>
    settingsActions.setTimezone(tz);
  const setDateFormatChoice = (df: DateFormat) =>
    settingsActions.setDateFormat(df);
  const toggleSystemNotifications = () =>
    settingsActions.setSystemNotifications(!systemNotifications);

  return (
    <Screen scroll padded>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900" }}>
            Configuración
          </Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>
            Preferencias generales (demo).
          </Text>
        </View>
      </View>

      {/* Cuenta */}
      <Card
        icon="person-outline"
        title="Cuenta"
        subtitle="Perfil, seguridad y sesión."
      >
        <View style={{ gap: 10 }}>
          <NavRow
            icon="id-card-outline"
            title="Perfil"
            subtitle="Nombre, correo, avatar (demo)."
            onPress={() => router.push("/(tabs)/settings/profile" as any)}
          />
          <NavRow
            icon="lock-closed-outline"
            title="Seguridad"
            subtitle="Cambiar contraseña (demo)."
            onPress={() => router.push("/(tabs)/settings/security" as any)}
          />
        </View>
      </Card>

      {/* Tema */}
      <Card
        icon="color-palette-outline"
        title="Tema"
        subtitle="Normal = tu azul original. Claro = fondo blanco. Oscuro = negro."
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <OptionPill
            label="NORMAL"
            active={themeMode === "normal"}
            onPress={() => setThemeChoice("normal")}
          />
          <OptionPill
            label="CLARO"
            active={themeMode === "light"}
            onPress={() => setThemeChoice("light")}
          />
          <OptionPill
            label="OSCURO"
            active={themeMode === "dark"}
            onPress={() => setThemeChoice("dark")}
          />
        </View>

        <Text style={{ color: colors.muted, marginTop: 10, fontSize: 12 }}>
          Guardado:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {hydrated ? themeMode.toUpperCase() : "CARGANDO..."}
          </Text>
        </Text>
      </Card>

      {/* IVA */}
      <Card
        icon="receipt-outline"
        title="Tasa de IVA"
        subtitle="Fija por defecto (demo). Luego la haremos por negocio."
      >
        <Text style={{ color: colors.muted }}>
          IVA actual:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>16%</Text>
        </Text>

        <Text style={{ color: colors.muted, marginTop: 6, fontSize: 12 }}>
          (Interno: taxRate = {(taxRate * 100).toFixed(0)}%)
        </Text>
      </Card>

      {/* Moneda */}
      <Card
        icon="cash-outline"
        title="Moneda"
        subtitle="Formateo de precios (demo)."
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <OptionPill
            label="MXN"
            active={currency === "MXN"}
            onPress={() => setCurrencyChoice("MXN")}
          />
          <OptionPill
            label="USD"
            active={currency === "USD"}
            onPress={() => setCurrencyChoice("USD")}
          />
          <OptionPill
            label="EUR"
            active={currency === "EUR"}
            onPress={() => setCurrencyChoice("EUR")}
          />
        </View>
      </Card>

      {/* Idioma */}
      <Card
        icon="language-outline"
        title="Idioma"
        subtitle="Texto / formato regional (demo)."
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <OptionPill
            label="ES (MX)"
            active={locale === "es-MX"}
            onPress={() => setLocaleChoice("es-MX")}
          />
          <OptionPill
            label="EN (US)"
            active={locale === "en-US"}
            onPress={() => setLocaleChoice("en-US")}
          />
        </View>

        <Text style={{ color: colors.muted, marginTop: 10, fontSize: 12 }}>
          Actual:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {locale}
          </Text>
        </Text>
      </Card>

      {/* Zona horaria */}
      <Card
        icon="time-outline"
        title="Zona horaria"
        subtitle="Afecta horas en reportes/ventas (demo)."
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <OptionPill
            label="México (CDMX)"
            active={timezone === "America/Mexico_City"}
            onPress={() => setTimezoneChoice("America/Mexico_City")}
          />
          <OptionPill
            label="UTC"
            active={timezone === "UTC"}
            onPress={() => setTimezoneChoice("UTC")}
          />
          <OptionPill
            label="Los Ángeles"
            active={timezone === "America/Los_Angeles"}
            onPress={() => setTimezoneChoice("America/Los_Angeles")}
          />
        </View>

        <Text style={{ color: colors.muted, marginTop: 10, fontSize: 12 }}>
          Actual:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {timezone}
          </Text>
        </Text>
      </Card>

      {/* Formato fecha */}
      <Card
        icon="calendar-outline"
        title="Formato de fecha"
        subtitle="Cómo se muestra la fecha (demo)."
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <OptionPill
            label="DMY (31/12/2026)"
            active={dateFormat === "DMY"}
            onPress={() => setDateFormatChoice("DMY")}
          />
          <OptionPill
            label="MDY (12/31/2026)"
            active={dateFormat === "MDY"}
            onPress={() => setDateFormatChoice("MDY")}
          />
          <OptionPill
            label="YMD (2026/12/31)"
            active={dateFormat === "YMD"}
            onPress={() => setDateFormatChoice("YMD")}
          />
        </View>

        <Text style={{ color: colors.muted, marginTop: 10, fontSize: 12 }}>
          Actual:{" "}
          <Text style={{ color: colors.text, fontWeight: "900" }}>
            {dateFormat}
          </Text>
        </Text>
      </Card>

      {/* Notificaciones */}
      <Card
        icon="notifications-outline"
        title="Notificaciones del sistema"
        subtitle="Activa/desactiva notificaciones globales (demo)."
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ color: colors.muted, flex: 1 }}>
            Estado:{" "}
            <Text style={{ color: colors.text, fontWeight: "900" }}>
              {systemNotifications ? "ACTIVADAS" : "DESACTIVADAS"}
            </Text>
          </Text>

          <Pressable
            onPress={toggleSystemNotifications}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              // ✅ FIX LIGHT: usa tokens del theme
              backgroundColor: systemNotifications
                ? colors.successBg
                : colors.pillBg,
            }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "900", fontSize: 12 }}
            >
              {systemNotifications ? "DESACTIVAR" : "ACTIVAR"}
            </Text>
          </Pressable>
        </View>
      </Card>

      {/* Más */}
      <Card
        icon="options-outline"
        title="Más"
        subtitle="Preferencias, datos demo y acerca de."
      >
        <View style={{ gap: 10 }}>
          <NavRow
            icon="sparkles-outline"
            title="Preferencias"
            subtitle="Opciones generales (demo)."
            onPress={() => router.push("/(tabs)/settings/preferences" as any)}
          />
          <NavRow
            icon="trash-outline"
            title="Datos (demo)"
            subtitle="Reiniciar datos guardados (smartbiz.*)."
            onPress={() => router.push("/(tabs)/settings/data" as any)}
          />
          <NavRow
            icon="information-circle-outline"
            title="Acerca de"
            subtitle="Versión y notas."
            onPress={() => router.push("/(tabs)/settings/about" as any)}
          />
        </View>
      </Card>

      {/* Acciones */}
      <View style={{ marginTop: 16, gap: 10 }}>
        <AppButton
          title="WIDGETS DEL DASHBOARD"
          onPress={() =>
            router.push("/(tabs)/settings/dashboard-widgets" as any)
          }
          variant="primary"
        />
        <AppButton
          title="VOLVER"
          onPress={() => router.back()}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}
