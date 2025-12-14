"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { KeyRound, LogOut, Mail, ShieldCheck } from "lucide-react";

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

function SoftButton({
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
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition",
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
        "text-white disabled:opacity-60",
        "bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
        "shadow-[0_12px_30px_-15px_rgba(99,102,241,0.55)]",
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
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
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

export default function SecuritySettingsPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);

  const [currentEmail, setCurrentEmail] = useState("");
  const [provider, setProvider] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const canSaveEmail = useMemo(() => {
    const v = newEmail.trim();
    return v.length > 5 && v.includes("@");
  }, [newEmail]);

  const canSavePass = useMemo(
    () => newPassword.trim().length >= 8,
    [newPassword]
  );

  useEffect(() => {
    async function init() {
      setLoading(true);

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login");
        return;
      }

      setCurrentEmail(data.user.email ?? "");
      setProvider(String(data.user.app_metadata?.provider ?? "email"));

      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateEmail() {
    if (!canSaveEmail) return;

    setSavingEmail(true);

    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim(),
    });

    setSavingEmail(false);

    if (error) return alert(error.message);

    alert("Permintaan update email terkirim ✅ Cek inbox email baru untuk verifikasi.");
    setNewEmail("");
  }

  async function updatePassword() {
    if (!canSavePass) return;

    setSavingPass(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword.trim(),
    });

    setSavingPass(false);

    if (error) return alert(error.message);

    alert("Password berhasil diupdate ✅");
    setNewPassword("");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <GlassCard className="p-5 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">
            Security Settings
          </div>
          <div className={cx("text-sm", subtleText)}>
            Ubah email/password dan kelola session login.
          </div>
        </div>

        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
          <ShieldCheck className="h-4 w-4 opacity-80" />
        </div>
      </div>

      {loading ? (
        <div className={cx("text-sm", subtleText)}>Loading...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/20 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
              <div className={cx("text-xs", subtleText)}>Email saat ini</div>
              <div className="mt-1 font-medium break-all">
                {currentEmail || "-"}
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
              <div className={cx("text-xs", subtleText)}>Login provider</div>
              <div className="mt-1 font-medium">{provider}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/40 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 opacity-80" />
              <div className="font-semibold tracking-tight">Ganti Email</div>
            </div>

            <div className={cx("mt-1 text-sm", subtleText)}>
              Supabase akan kirim email verifikasi ke email baru.
            </div>

            <div className="mt-4 space-y-3">
              <input
                className={inputCls}
                placeholder="emailbaru@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="email"
              />

              <SoftButton
                onClick={updateEmail}
                disabled={!canSaveEmail || savingEmail}
              >
                {savingEmail ? "Mengirim verifikasi..." : "Update Email"}
              </SoftButton>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/40 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 opacity-80" />
              <div className="font-semibold tracking-tight">Ganti Password</div>
            </div>

            <div className={cx("mt-1 text-sm", subtleText)}>
              Minimal 8 karakter.
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                className={inputCls}
                placeholder="Password baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />

              <PrimaryButton
                onClick={updatePassword}
                disabled={!canSavePass || savingPass}
              >
                {savingPass ? "Mengupdate..." : "Update Password"}
              </PrimaryButton>

              <div className={cx("text-xs", subtleText)}>
                Kalau login pakai Google, password tetap boleh dibuat supaya kamu bisa
                login via email/password juga.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/40 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4 opacity-80" />
              <div className="font-semibold tracking-tight">Session</div>
            </div>

            <div className="mt-4">
              <DangerButton onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </DangerButton>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}
