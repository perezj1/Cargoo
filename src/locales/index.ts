import { de } from "@/locales/de";
import { en } from "@/locales/en";
import { es } from "@/locales/es";
import { sr } from "@/locales/sr";

export const LOCALE_STORAGE_KEY = "cargoo.locale";
export const SUPPORTED_LOCALES = ["es", "en", "de", "sr"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type Messages = typeof es;

export const localeMessages: Record<Locale, Messages> = {
  es,
  en,
  de,
  sr,
};

export const normalizeLocale = (value: string | null | undefined): Locale => {
  const normalized = (value ?? "").toLowerCase();

  if (normalized.startsWith("de")) {
    return "de";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  if (normalized.startsWith("sr")) {
    return "sr";
  }

  return "es";
};

export const detectBrowserLocale = (): Locale => {
  if (typeof navigator === "undefined") {
    return "es";
  }

  const candidates = [...navigator.languages, navigator.language].filter(Boolean);
  return normalizeLocale(candidates[0]);
};

export const getIntlLocale = (locale: Locale) => localeMessages[locale].intlLocale;
