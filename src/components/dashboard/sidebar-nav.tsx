"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  ShoppingBag,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";

const NAV = [
  { label: "Home", href: "/dashboard/home", icon: Home },
  { label: "Post", href: "/dashboard/post", icon: FileText },
  { label: "Jualan", href: "/dashboard/jualan", icon: ShoppingBag },
  { label: "Static", href: "/dashboard/static", icon: BarChart3 },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const active = pathname.startsWith(n.href);
        const Icon = n.icon;

        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={[
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm border transition",
              active
                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/10",
            ].join(" ")}
          >
            <Icon size={16} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
