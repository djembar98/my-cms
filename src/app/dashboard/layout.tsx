"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { MobileDrawer } from "@/components/dashboard/mobile-drawer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileDrawer open={open} onClose={() => setOpen(false)} />

      <div className="md:pl-64">
        <Topbar onOpen={() => setOpen(true)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
