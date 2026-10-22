import { createContext, use, useEffect, useState, type ReactNode } from "react";

import { THEME_STORAGE_KEY, type Theme } from "@/constants/theme";

type ResolvedTheme = Exclude<Theme, "system">;

interface IThemeContext {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<IThemeContext | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function getSystemTheme(): ResolvedTheme {
  return matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const media = matchMedia(DARK_QUERY);
    const handleChange = () => setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  function setTheme(next: Theme) {
    setThemeState(next);
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Сақтау мүмкін болмаса (жеке режим) — тақырып тек осы сессияда қалады.
    }
  }

  return <ThemeContext value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext>;
}

export function useTheme(): IThemeContext {
  const context = use(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
