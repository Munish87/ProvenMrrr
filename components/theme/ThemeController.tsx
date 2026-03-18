"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "provenmrr-theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeController() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme: ThemeMode = storedTheme === "light" ? "light" : "dark";
    applyTheme(initialTheme);
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="glass theme-toggle-fab"
      aria-label={mounted && theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={mounted && theme === "light" ? "Dark theme" : "Light theme"}
    >
      {mounted && theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
