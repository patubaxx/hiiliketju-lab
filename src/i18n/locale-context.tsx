"use client";

import * as React from "react";

import { type Locale, translate } from "@/i18n/messages";

const STORAGE_KEY = "hiiliketju.locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (id: string, vars?: Record<string, string>) => string;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "en" || raw === "fi" || raw === "sv") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

const DEFAULT_LOCALE: Locale = "fi";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  /**
   * Always start at `fi` on server and the client’s first render so the DOM matches the server (avoids
   * hydration mismatch). A separate effect applies `localStorage` after commit (see `readStoredLocale`).
   */
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);

  /**
   * Apply stored locale in a new task so the initial commit stays `fi` and matches server HTML.
   * (Testing `render()` is wrapped in `act` and would otherwise flush a synchronous `setState` from
   * this effect before the first `expect`, hiding the pre-hydration Finnish state.)
   */
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = readStoredLocale();
      if (stored) {
        setLocaleState(stored);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = React.useCallback(
    (id: string, vars?: Record<string, string>) => translate(locale, id, vars),
    [locale],
  );

  const value = React.useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
