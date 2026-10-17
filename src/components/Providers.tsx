"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { dict, Lang } from "@/i18n/dict";
interface User { id: string; login: string; email: string; role: string; mustChangePass: boolean; accounts: { provider: string }[] }
const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: typeof dict.ru }>({ lang: "ru", setLang: () => {}, t: dict.ru });
const UserCtx = createContext<{ user: User | null; reload: () => void }>({ user: null, reload: () => {} });
export const useLang = () => useContext(LangCtx);
export const useUser = () => useContext(UserCtx);
export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const l = (localStorage.getItem("mb_lang") as Lang) || "ru";
    setLangState(l === "en" ? "en" : "ru");
    const th = localStorage.getItem("mb_theme") || "dark";
    setTheme(th); document.documentElement.setAttribute("data-theme", th === "light" ? "light" : "dark");
    reload();
  }, []);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("mb_lang", l); };
  const reload = async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const d = await r.json();
      setUser(d.user || null);
    } catch { setUser(null); }
  };
  const toggleTheme = () => {
    const n = theme === "light" ? "dark" : "light";
    setTheme(n); localStorage.setItem("mb_theme", n);
    document.documentElement.setAttribute("data-theme", n === "light" ? "light" : "dark");
  };
  (globalThis as unknown as { __toggleTheme?: () => void }).__toggleTheme = toggleTheme;
  (globalThis as unknown as { __theme?: string }).__theme = theme;
  return (
    <LangCtx.Provider value={{ lang, setLang, t: dict[lang] }}>
      <UserCtx.Provider value={{ user, reload }}>{children}</UserCtx.Provider>
    </LangCtx.Provider>
  );
}
export function themeToggle() {
  (globalThis as unknown as { __toggleTheme?: () => void }).__toggleTheme?.();
}
