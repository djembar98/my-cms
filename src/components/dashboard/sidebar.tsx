"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export function Sidebar() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cx(
        "hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col",
        "border-r border-white/20 bg-white/40 backdrop-blur-xl",
        "dark:border-white/10 dark:bg-white/5"
      )}
    >
      <div className="flex h-full flex-col p-4">
        {/* Brand */}
        <div className="mb-4">
          <div className="rounded-3xl border border-white/20 bg-white/45 p-4 shadow-[0_20px_60px_-35px_rgba(2,6,23,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/25 bg-white/45 shadow-sm dark:border-white/10 dark:bg-white/5">
                <span className="font-semibold tracking-tight">M</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">MyCMS</div>
                <div className="text-xs text-slate-600/70 dark:text-slate-300/60">
                  Admin Dashboard
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="rounded-3xl border border-white/20 bg-white/45 shadow-[0_20px_60px_-35px_rgba(2,6,23,0.30)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <SidebarNav />
        </div>

        {/* Logout */}
        <div className="mt-auto pt-4">
          <button
            onClick={logout}
            className={cx(
              "group w-full inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
              "border-slate-200/70 bg-white/60 hover:bg-white/80",
              "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            )}
          >
            <LogOut className="h-4 w-4 opacity-85" />
            Log out
          </button>

          <div className="mt-3 text-[11px] leading-relaxed text-slate-600/60 dark:text-slate-300/50">
            Keluar dari dashboard admin MyCMS.
          </div>
        </div>
      </div>
    </aside>
  );
}
