"use client";

import { SidebarNav } from "./sidebar-nav";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 md:hidden">
      {/* Backdrop */}
      <button
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] dark:bg-black/50"
        aria-label="Close"
        type="button"
      />

      {/* Panel */}
      <div
        className={cx(
          "absolute inset-y-0 left-0 w-[290px] overflow-hidden",
          "border-r border-white/20 bg-white/45 backdrop-blur-xl",
          "shadow-[0_20px_60px_-25px_rgba(2,6,23,0.45)]",
          "dark:border-white/10 dark:bg-white/5"
        )}
      >
        <SidebarNav onNavigate={onClose} />
      </div>
    </div>
  );
}
