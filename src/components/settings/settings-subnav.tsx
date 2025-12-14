"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard/settings/profile", label: "Profile Settings" },
  { href: "/dashboard/settings/theme", label: "Theme Settings" },
  { href: "/dashboard/settings/security", label: "Security Settings" },
];

export function SettingsSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const active = pathname === it.href;

        return (
          <Link
            key={it.href}
            href={it.href}
            className={[
              "rounded-xl px-3 py-2 text-sm border transition",
              active
                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                : "hover:bg-black/5 dark:hover:bg-white/10 border-transparent",
            ].join(" ")}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
