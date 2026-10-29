import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { TRANSLATIONS } from '../i18n/admin.js';

const STORAGE_KEY = 'durus.adminLang';
const I18nContext = createContext(null);

export function AdminLangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof localStorage === 'undefined') return 'ar';
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'ar';
  });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
  }, [lang, t.dir]);

  const value = useMemo(
    () => ({
      lang,
      t,
      dir: t.dir,
      toggleLang: () => setLang((p) => (p === 'ar' ? 'en' : 'ar')),
    }),
    [lang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside AdminLangProvider');
  return ctx;
}