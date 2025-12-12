"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/dashboard/home")) return "Home";
  if (pathname.startsWith("/dashboard/post")) return "Post";
  if (pathname.startsWith("/dashboard/jualan")) return "Jualan";
  if (pathname.startsWith("/dashboard/static")) return "Static";
  if (pathname.startsWith("/dashboard/notifications")) return "Notifications";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "Dashboard";
}

export function Topbar({ onOpen }: { onOpen: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur dark:bg-neutral-950/70">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpen}
            className="inline-flex md:hidden items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Open sidebar"
          >
            <Menu size={16} />
          </button>

          <div className="font-semibold">{titleFromPath(pathname)}</div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
