"use client";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close sidebar backdrop"
      />
      <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-neutral-950 border-r p-4">
        <div className="mb-4">
          <div className="text-lg font-semibold">MyCMS</div>
          <div className="text-xs text-black/60 dark:text-white/60">
            Admin Dashboard
          </div>
        </div>

        <SidebarNav onNavigate={onClose} />
      </div>
    </div>
  );
}
