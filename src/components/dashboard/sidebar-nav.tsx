"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, FileText, BarChart3, Settings, BellRing } from "lucide-react";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

const NAV = [
  { href: "/dashboard/home", label: "Home", icon: Home },
  { href: "/dashboard/jualan", label: "Jualan", icon: Package },
  { href: "/dashboard/post", label: "Post", icon: FileText },
  { href: "/dashboard/static", label: "Static", icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Notifications", icon: BellRing },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2 p-3">
      <div className="px-2 pb-2">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
            <span className="font-semibold">M</span>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">MyCMS</div>
            <div className="text-xs text-slate-600/70 dark:text-slate-300/60">
              Admin workspace
            </div>
          </div>
        </div>
      </div>

      {NAV.map((n) => {
        const active =
          pathname === n.href || pathname.startsWith(n.href + "/");
        const Icon = n.icon;

        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={cx(
              "flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition",
              "border-slate-200/70 bg-white/60 hover:bg-white/80",
              "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
              active &&
                cx(
                  "border-indigo-400/30 bg-indigo-500/10",
                  "dark:border-sky-400/25 dark:bg-sky-500/10"
                )
            )}
          >
            <Icon className="h-4 w-4 opacity-80" />
            <span className="font-medium">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
