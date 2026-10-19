import { useCallback, useEffect, useState } from "react";

const KEY = "redactor:theme";
export type Theme = "light" | "dark";

function saved(): Theme | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/** Theme state. js/theme.js sets the first value before paint; this hook owns changes after that. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === "light" ? "light" : "dark"));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Follow the OS theme until the user picks one explicitly.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event: MediaQueryListEvent) => {
      if (!saved()) setTheme(event.matches ? "light" : "dark");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Storage disabled: the choice lasts for this page only.
    }
  }, [theme]);

  return { theme, toggle };
}
