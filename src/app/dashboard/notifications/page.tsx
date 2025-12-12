"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NotificationType = "info" | "warning" | "success" | "error";

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  is_read: boolean;
  created_at: string;

  // deep link
  link_path: string | null;
  entity_type: string | null;
  entity_id: string | null;
  meta: Record<string, unknown>;
};

function badgeClass(t: NotificationType) {
  switch (t) {
    case "warning":
      return "border-yellow-500/40 text-yellow-700 dark:text-yellow-300";
    case "success":
      return "border-emerald-500/40 text-emerald-700 dark:text-emerald-300";
    case "error":
      return "border-red-500/40 text-red-700 dark:text-red-300";
    default:
      return "border-black/20 text-black/70 dark:text-white/70";
  }
}

export default function NotificationsPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "unread") return items.filter((x) => !x.is_read);
    return items;
  }, [items, tab]);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id,title,body,type,is_read,created_at,link_path,entity_type,entity_id,meta"
      )
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as NotificationRow[]);
    setLoading(false);
  }

  async function markRead(id: string) {
    // optimistic
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, is_read: true } : x))
    );

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      // rollback
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, is_read: false } : x))
      );
      alert(error.message);
    }
  }

  async function openNotification(n: NotificationRow) {
    setBusyId(n.id);
    await markRead(n.id);
    setBusyId(null);

    if (n.link_path && n.link_path.startsWith("/")) {
      router.push(n.link_path);
    }
  }

  async function deleteOne(id: string) {
    const ok = confirm("Hapus notifikasi ini?");
    if (!ok) return;

    setBusyId(id);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    setBusyId(null);

    if (error) return alert(error.message);

    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function deleteAll() {
    const ok = confirm("Hapus SEMUA notifikasi?");
    if (!ok) return;

    setBusyId("ALL");

    const { error } = await supabase
      .from("notifications")
      .delete()
      .neq("id", "");

    setBusyId(null);

    if (error) return alert(error.message);

    setItems([]);
  }

  async function markAllRead() {
    setBusyId("READALL");

    // optimistic
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    setBusyId(null);

    if (error) {
      alert(error.message);
      load();
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
        <div className="text-lg font-semibold">Notifications</div>
        <div className="text-sm text-black/60 dark:text-white/60">
          Klik notifikasi untuk menuju halaman terkait (post/static/dll).
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("all")}
              className={[
                "rounded-lg border px-3 py-2 text-sm",
                tab === "all"
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                  : "hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              Semua
            </button>
            <button
              onClick={() => setTab("unread")}
              className={[
                "rounded-lg border px-3 py-2 text-sm",
                tab === "unread"
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                  : "hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              Belum dibaca
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Refresh
            </button>

            <button
              onClick={markAllRead}
              disabled={busyId === "READALL"}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10"
            >
              {busyId === "READALL" ? "..." : "Tandai semua dibaca"}
            </button>

            <button
              onClick={deleteAll}
              disabled={busyId === "ALL"}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10"
            >
              {busyId === "ALL" ? "..." : "Hapus semua"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-black/60 dark:text-white/60">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-black/60 dark:text-white/60">
            Tidak ada notifikasi.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={[
                  "rounded-2xl border p-4 transition",
                  n.is_read ? "opacity-80" : "bg-black/5 dark:bg-white/10",
                ].join(" ")}
              >
                <button
                  onClick={() => openNotification(n)}
                  disabled={busyId === n.id}
                  className="w-full text-left disabled:opacity-70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{n.title}</div>
                        {!n.is_read && (
                          <span className="text-[10px] rounded-full border px-2 py-1">
                            NEW
                          </span>
                        )}
                      </div>

                      {n.body && (
                        <div className="text-sm text-black/60 dark:text-white/60 whitespace-pre-wrap">
                          {n.body}
                        </div>
                      )}

                      <div className="text-xs text-black/50 dark:text-white/50">
                        {new Date(n.created_at).toLocaleString("id-ID")}
                        {n.link_path ? (
                          <span className="ml-2">
                            • <span className="underline">Klik untuk buka</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className={[
                        "text-[10px] rounded-full border px-2 py-1 uppercase",
                        badgeClass(n.type),
                      ].join(" ")}
                    >
                      {n.type}
                    </span>
                  </div>
                </button>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOne(n.id);
                    }}
                    disabled={busyId === n.id}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
