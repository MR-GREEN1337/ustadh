"use client"

import { useCallback, useEffect, useState } from "react";
import { Locale, defaultLocale, locales } from "./config";
import type { Dictionary } from "./config";
import { useParams } from "next/navigation";

export function useLocale(): Locale {
  const params = useParams();
  const locale = params?.locale as string;

  // Check if the locale from params is valid
  if (!locale || !locales.includes(locale)) {
    return defaultLocale;
  }

  return locale as Locale;
}

export function useDictionary() {
  const locale = useLocale();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);

  useEffect(() => {
    const loadDictionary = async () => {
      const dict = (await import(`./dictionaries/${locale}.ts`)).dictionary;
      setDictionary(dict);
    };

    loadDictionary();
  }, [locale]);

  return dictionary;
}

export function useTranslation() {
  const dictionary = useDictionary();

  const t = useCallback((key: keyof Dictionary, params?: Record<string, string>) => {
    if (!dictionary) return "";

    let translation = dictionary[key];

    // Replace parameters in the translation string
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        translation = translation.replace(`{${key}}`, value);
      });
    }

    return translation;
  }, [dictionary]);

  return { t };
}
