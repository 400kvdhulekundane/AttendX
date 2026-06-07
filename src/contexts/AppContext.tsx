import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Language } from "../lib/i18n";

interface AppContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  isOnline: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("attendx_theme") as "light" | "dark") ?? "light";
  });

  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem("attendx_lang") as Language) ?? "en";
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("attendx_theme", theme);
  }, [theme]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("attendx_lang", l);
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, setLang, isOnline }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
