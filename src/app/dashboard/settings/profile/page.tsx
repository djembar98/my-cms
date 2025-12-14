"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { User } from "lucide-react";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

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

const inputCls = cx(
  "w-full rounded-2xl border bg-white/60 px-4 py-3 text-sm outline-none transition",
  "border-slate-200/70 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/15",
  "dark:bg-white/5 dark:border-white/10 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/15"
);

function PrimaryButton({
  onClick,
  disabled,
  children,
  className,
}: {
  onClick?: () => void;
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
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        "text-white disabled:opacity-60 disabled:pointer-events-none",
        "bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
        "shadow-[0_12px_30px_-15px_rgba(99,102,241,0.55)]",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function ProfileSettingsPage() {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("");

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => fullName.trim().length > 0, [fullName]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setLoading(false);
        return;
      }

      const u = data.user;
      setEmail(u.email ?? "");
      setProvider(String(u.app_metadata?.provider ?? "email"));

      const metaName =
        (u.user_metadata?.full_name as string | undefined) ||
        (u.user_metadata?.name as string | undefined) ||
        "";
      setFullName(metaName);

      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!canSave) return;
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });

    setSaving(false);
    if (error) return alert(error.message);

    alert("Profil disimpan ✅");
  }

  return (
    <GlassCard className="p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold tracking-tight">
            Profile Settings
          </div>
          <div className={cx("text-sm", subtleText)}>
            Atur nama tampilan untuk dipakai di dashboard.
          </div>
        </div>

        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
          <User className="h-4 w-4 opacity-80" />
        </div>
      </div>

      {loading ? (
        <div className={cx("text-sm", subtleText)}>Loading...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/20 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
              <div className={cx("text-xs", subtleText)}>Email</div>
              <div className="mt-1 font-medium break-all">{email || "-"}</div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
              <div className={cx("text-xs", subtleText)}>Provider</div>
              <div className="mt-1 font-medium">{provider}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/40 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold tracking-tight">
              Nama tampilan
            </div>

            <div className="mt-4 space-y-3">
              <input
                className={inputCls}
                placeholder="Nama kamu"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <PrimaryButton onClick={save} disabled={!canSave || saving}>
                {saving ? "Menyimpan..." : "Simpan Profil"}
              </PrimaryButton>

              <div className={cx("text-xs", subtleText)}>
                (Opsional) Foto & logo project bisa kamu tambahin nanti via
                Cloudinary kalau sudah siap.
              </div>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}
