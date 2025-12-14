"use client";

import { ReactNode, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileDrawer } from "@/components/dashboard/mobile-drawer";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <main
      className={cx(
        "min-h-screen",
        "bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.08),transparent_55%)]",
        "bg-slate-50 text-slate-900",
        "dark:bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.06),transparent_55%)]",
        "dark:bg-[#0b1020] dark:text-slate-100"
      )}
    >
      <div className="mx-auto min-h-screen max-w-7xl p-4 sm:p-6">
        <div
          className={cx(
            "grid overflow-hidden rounded-3xl",
            "border border-white/20 bg-white/50 shadow-[0_20px_60px_-25px_rgba(2,6,23,0.35)] backdrop-blur-xl",
            "dark:border-white/10 dark:bg-white/5",
            "md:grid-cols-[280px_1fr]"
          )}
        >
          {/* Desktop sidebar */}
          <aside
            className={cx(
              "hidden md:block",
              "border-r border-white/15 dark:border-white/10"
            )}
          >
            <SidebarNav />
          </aside>

          {/* Mobile drawer */}
          <MobileDrawer open={open} onClose={() => setOpen(false)} />

          {/* Main */}
          <div className="min-w-0">
            <Topbar onOpen={() => setOpen(true)} />

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
