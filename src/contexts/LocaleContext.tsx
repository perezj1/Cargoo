import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { updateCurrentUser } from "@/lib/cargoo-store";
import {
  detectBrowserLocale,
  getIntlLocale,
  LOCALE_STORAGE_KEY,
  localeMessages,
  normalizeLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/locales";

interface LocaleContextValue {
  locale: Locale;
  intlLocale: string;
  messages: (typeof localeMessages)[Locale];
  supportedLocales: readonly Locale[];
  setLocale: (nextLocale: Locale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);
let warnedMissingLocaleProvider = false;

const applyLocaleSideEffects = (locale: Locale) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
};

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") {
    return "es";
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return storedLocale ? normalizeLocale(storedLocale) : detectBrowserLocale();
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const { profile, refreshProfile } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    applyLocaleSideEffects(locale);
  }, [locale]);

  useEffect(() => {
    if (!profile?.locale) {
      return;
    }

    const profileLocale = normalizeLocale(profile.locale);
    if (profileLocale !== locale) {
      setLocaleState(profileLocale);
    }
  }, [locale, profile?.locale]);

  const setLocale = async (nextLocale: Locale) => {
    const normalizedLocale = normalizeLocale(nextLocale);
    const previousLocale = locale;

    if (normalizedLocale === previousLocale) {
      return;
    }

    setLocaleState(normalizedLocale);

    if (!profile || normalizedLocale === normalizeLocale(profile.locale)) {
      return;
    }

    try {
      await updateCurrentUser({ locale: normalizedLocale });
      await refreshProfile();
    } catch (error) {
      setLocaleState(previousLocale);
      throw error;
    }
  };

  return (
    <LocaleContext.Provider
      value={{
        locale,
        intlLocale: getIntlLocale(locale),
        messages: localeMessages[locale],
        supportedLocales: SUPPORTED_LOCALES,
        setLocale,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);

  if (context) {
    return context;
  }

  const fallbackLocale = getInitialLocale();

  if (!warnedMissingLocaleProvider && typeof window !== "undefined") {
    warnedMissingLocaleProvider = true;
    console.warn("useLocale was used outside LocaleProvider. Falling back to the stored or browser locale.");
  }

  return {
    locale: fallbackLocale,
    intlLocale: getIntlLocale(fallbackLocale),
    messages: localeMessages[fallbackLocale],
    supportedLocales: SUPPORTED_LOCALES,
    setLocale: async () => {
      throw new Error("setLocale is unavailable outside LocaleProvider.");
    },
  };
};
