"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const isClient = useIsClient();
  const { resolvedTheme, setTheme } = useTheme();

  if (!isClient || !resolvedTheme) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        const next = isDark ? "light" : "dark";
        setTheme(next);
        console.log(
          "theme ->",
          next,
          "html.class:",
          document.documentElement.className
        );
      }}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
