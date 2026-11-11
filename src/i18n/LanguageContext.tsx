import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { STRINGS, type Lang, type StringKey } from './strings';

type LanguageCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
};

const Ctx = createContext<LanguageCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('sc-lang') : null;
    return saved === 'en' ? 'en' : 'es';
  });

  const value = useMemo<LanguageCtx>(
    () => ({
      lang,
      setLang: (l) => {
        setLang(l);
        try { localStorage.setItem('sc-lang', l); } catch { /* ignore */ }
      },
      t: (key) => STRINGS[lang][key],
    }),
    [lang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
