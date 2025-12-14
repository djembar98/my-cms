"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "light" : "dark");
      }}
      className={cx("btn btn-ghost", className)}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <Sun className="h-4 w-4 hidden dark:block" />
      <Moon className="h-4 w-4 block dark:hidden" />
      <span className="hidden sm:inline">Theme</span>
    </button>
  );
}
