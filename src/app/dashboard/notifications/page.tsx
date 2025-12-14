"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CheckCheck, RefreshCw, Trash2 } from "lucide-react";

type NotifRow = {
  id: string;
  title: string;
  body: string | null;
  type: "info" | "warning" | "success" | "error" | string;
  link_path: string | null;
  is_read: boolean;
  created_at: string;
  meta: Record<string, unknown>;
};

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

function fmtDate(s: string) {
  try {
    const d = new Date(s);
    return d.toLocaleString();
  } catch {
    return s;
  }
}

/* ---------- shared style (konsisten login/dashboard) ---------- */

const subtleText = "text-slate-600/80 dark:text-slate-300/70";

function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-white/20 bg-white/50 backdrop-blur-xl",
        "shadow-[0_20px_60px_-25px_rgba(2,6,23,0.18)]",
        "dark:border-white/10 dark:bg-white/5",
        className
      )}
    >
      {children}
    </div>
  );
}

function SoftButton({
  onClick,
  disabled,
  children,
  className,
  type,
}: {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
        "border-slate-200/70 bg-white/60 hover:bg-white/80",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
        "disabled:opacity-60 disabled:pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  );
}

function DangerButton({
  onClick,
  disabled,
  children,
  className,
}: {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
        "border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15",
        "dark:text-rose-200",
        "disabled:opacity-60 disabled:pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  );
}

function Badge({ type }: { type: string }) {
  const tone =
    type === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
      : type === "warning"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
      : type === "error"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200"
      : "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-2xl border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md",
        tone
      )}
    >
      {type}
    </span>
  );
}

function UnreadDot() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-200">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
      unread
    </span>
  );
}

/* ------------------------------------------------------------- */

export default function NotificationsPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotifRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markAllBusy, setMarkAllBusy] = useState(false);

  const unreadCount = useMemo(
    () => items.filter((x) => !x.is_read).length,
    [items]
  );

  async function load() {
    setLoading(true);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id,title,body,type,link_path,is_read,created_at,meta")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      alert(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as NotifRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead(id: string) {
    setBusyId(id);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setBusyId(null);

    if (error) return alert(error.message);

    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAllRead() {
    setMarkAllBusy(true);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    setMarkAllBusy(false);

    if (error) return alert(error.message);

    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function deleteOne(id: string) {
    const ok = confirm("Hapus notifikasi ini?");
    if (!ok) return;

    setBusyId(id);

    const { error } = await supabase.from("notifications").delete().eq("id", id);

    setBusyId(null);

    if (error) return alert(error.message);

    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  async function onCardClick(n: NotifRow) {
    if (n.link_path) {
      if (!n.is_read) await markRead(n.id);
      router.push(n.link_path);
      return;
    }
    if (!n.is_read) await markRead(n.id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold tracking-tight">
              Notifications
            </div>
            <div className={cx("mt-1 text-sm", subtleText)}>
              Klik notifikasi untuk menandai sebagai dibaca. Jika punya link,
              kamu akan diarahkan ke halaman terkait.
            </div>
            <div className={cx("mt-2 text-xs", subtleText)}>
              Unread: <span className="font-semibold">{unreadCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SoftButton
              onClick={markAllRead}
              disabled={markAllBusy || items.length === 0}
            >
              <CheckCheck className="h-4 w-4" />
              {markAllBusy ? "..." : "Mark all read"}
            </SoftButton>

            <SoftButton onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </SoftButton>
          </div>
        </div>
      </GlassCard>

      {/* List */}
      <GlassCard className="p-5 sm:p-6">
        {loading ? (
          <div className={cx("text-sm", subtleText)}>Loading...</div>
        ) : items.length === 0 ? (
          <div className={cx("text-sm", subtleText)}>Belum ada notifikasi.</div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <div
                key={n.id}
                onClick={() => onCardClick(n)}
                className={cx(
                  "group cursor-pointer rounded-3xl border p-4 transition",
                  "border-white/20 bg-white/40 hover:bg-white/60",
                  "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                  !n.is_read && "ring-1 ring-indigo-400/15 dark:ring-sky-400/15"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge type={n.type} />
                      {!n.is_read && <UnreadDot />}
                    </div>

                    <div className="mt-1 font-semibold truncate">{n.title}</div>

                    {n.body && (
                      <div className={cx("mt-1 text-sm", subtleText)}>
                        {n.body}
                      </div>
                    )}

                    <div
                      className={cx(
                        "mt-2 text-xs text-slate-500",
                        "dark:text-slate-400"
                      )}
                    >
                      {fmtDate(n.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <SoftButton
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n.id);
                        }}
                        disabled={busyId === n.id}
                        className="px-3"
                      >
                        {busyId === n.id ? "..." : "Read"}
                      </SoftButton>
                    )}

                    <DangerButton
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOne(n.id);
                      }}
                      disabled={busyId === n.id}
                      className="px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DangerButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
