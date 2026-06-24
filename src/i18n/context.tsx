import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Language } from "./translations";
import * as storage from "../lib/storage";

export const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
];

type Vars = Record<string, string | number>;

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  /** Translate a key for the active language, with `{var}` interpolation. */
  t: (key: string, vars?: Vars) => string;
  isLoaded: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await storage.loadLanguage();
      if (stored && stored in translations) setLangState(stored as Language);
      setIsLoaded(true);
    })();
  }, []);

  // Reflect the active language on <html lang> for a11y / browser hints.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    storage.saveLanguage(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const dict = translations[lang] ?? translations.en;
      const value = dict[key] ?? translations.en[key] ?? key;
      return interpolate(value, vars);
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, isLoaded }),
    [lang, setLang, t, isLoaded],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
