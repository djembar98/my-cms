"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export function Topbar({ onOpen }: { onOpen: () => void }) {
  return (
    <header
      className={cx(
        "sticky top-0 z-20",
        "border-b border-white/20 bg-white/40 backdrop-blur-xl",
        "dark:border-white/10 dark:bg-white/5"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={onOpen}
          className={cx(
            "md:hidden inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition",
            "border-slate-200/70 bg-white/55 hover:bg-white/75",
            "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          )}
          type="button"
        >
          <Menu className="h-4 w-4 opacity-85" />
          <span className="hidden sm:inline">Menu</span>
        </button>

        <div className="hidden md:block" />

        <div className="flex items-center gap-2">
          <ThemeToggle className="border-slate-200/70 bg-white/60 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" />
        </div>
      </div>
    </header>
  );
}
