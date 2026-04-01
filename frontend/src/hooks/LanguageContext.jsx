import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../i18n/translations";

const STORAGE_KEY = "verdex_language";
const SUPPORTED_LANGUAGES = ["en", "hi", "kn"];

const LanguageContext = createContext(null);

function readStoredLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (SUPPORTED_LANGUAGES.includes(saved)) {
    return saved;
  }
  return "en";
}

function getByPath(source, path) {
  return path.split(".").reduce((value, segment) => {
    if (value && typeof value === "object") {
      return value[segment];
    }
    return undefined;
  }, source);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(readStoredLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => {
    const dictionary = translations[language] || translations.en;

    function t(key, fallback = "") {
      const translated = getByPath(dictionary, key);
      if (typeof translated === "string") {
        return translated;
      }

      const englishValue = getByPath(translations.en, key);
      if (typeof englishValue === "string") {
        return englishValue;
      }

      return fallback || key;
    }

    function tr(text) {
      const normalized = String(text || "");
      if (!normalized) {
        return normalized;
      }

      const literalMap = dictionary?.literals || {};
      if (typeof literalMap[normalized] === "string") {
        return literalMap[normalized];
      }

      return normalized;
    }

    function translateRole(role) {
      const roleKey = String(role || "").trim();
      if (!roleKey) {
        return "";
      }

      return t(`roles.${roleKey}`, roleKey);
    }

    return {
      language,
      setLanguage: (nextLanguage) => {
        if (SUPPORTED_LANGUAGES.includes(nextLanguage)) {
          setLanguage(nextLanguage);
        }
      },
      languages: SUPPORTED_LANGUAGES,
      t,
      tr,
      translateRole,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
