"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileDrawer } from "@/components/dashboard/mobile-drawer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={[
        "min-h-screen",
        "bg-[radial-gradient(1100px_circle_at_20%_0%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(900px_circle_at_80%_10%,rgba(99,102,241,0.10),transparent_55%)]",
      ].join(" ")}
    >
      <MobileDrawer open={open} onClose={() => setOpen(false)} />

      <aside className="hidden md:block fixed inset-y-0 left-0 w-72 border-r border-border/20 bg-surface/40 backdrop-blur-xl">
        <SidebarNav />
      </aside>

      <div className="md:pl-72">
        <Topbar onOpen={() => setOpen(true)} />

        <main className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
