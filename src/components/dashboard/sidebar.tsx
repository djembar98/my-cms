"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export function Sidebar() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r bg-white dark:bg-neutral-950">
      <div className="flex h-full flex-col p-4">
        <div className="mb-4">
          <div className="text-lg font-semibold">MyCMS</div>
          <div className="text-xs text-black/60 dark:text-white/60">
            Admin Dashboard
          </div>
        </div>

        <SidebarNav />

        <div className="mt-auto pt-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
