"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Mail, Lock, ArrowRight, Chrome } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) return setErr(error.message);

    router.push("/dashboard/home");
  }

  async function onGoogle() {
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) setErr(error.message);
  }

  return (
    <main
      className={cx(
        "min-h-screen",
        "bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.16),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.10),transparent_55%)]",
        "bg-slate-50 text-slate-900",
        "dark:bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.08),transparent_55%)]",
        "dark:bg-[#0b1020] dark:text-slate-100"
      )}
    >
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4 sm:p-6">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/20 bg-white/50 shadow-[0_20px_60px_-25px_rgba(2,6,23,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 md:grid-cols-2">
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(99,102,241,0.16),rgba(56,189,248,0.12),rgba(16,185,129,0.10))]" />
            <div className="absolute inset-0 opacity-60 [mask-image:radial-gradient(500px_circle_at_30%_20%,black,transparent)] bg-[linear-gradient(0deg,rgba(255,255,255,0.6),transparent)] dark:bg-[linear-gradient(0deg,rgba(15,23,42,0.8),transparent)]" />

            <div className="relative flex h-full flex-col justify-between p-10">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
                  <span className="text-lg font-semibold tracking-tight">M</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800/80 dark:text-slate-200/80">
                    MyCMS
                  </div>
                  <div className="text-xs text-slate-700/60 dark:text-slate-300/60">
                    Admin workspace
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Masuk & kelola konten dengan rapi.
                </h2>
                <p className="max-w-sm text-sm leading-relaxed text-slate-700/70 dark:text-slate-300/70">
                  UI modern, cepat, dan nyaman. Dark/light mode, Google login,
                  dan responsif.
                </p>

                <div className="grid max-w-sm grid-cols-2 gap-3 pt-2">
                  {[
                    { t: "Responsive", s: "Mobile-first" },
                    { t: "Supabase", s: "Auth + DB" },
                    { t: "Dark/Light", s: "Theme toggle" },
                    { t: "Gestalt UI", s: "Rapi & fokus" },
                  ].map((x) => (
                    <div
                      key={x.t}
                      className="rounded-2xl border border-white/25 bg-white/35 p-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="text-sm font-medium">{x.t}</div>
                      <div className="text-xs text-slate-700/60 dark:text-slate-300/60">
                        {x.s}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-700/60 dark:text-slate-300/60">
                Tip: Gunakan Google login untuk akses cepat.
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8 md:p-10">
            <div className="mx-auto w-full max-w-md space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="md:hidden flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
                      <span className="font-semibold">M</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">MyCMS</div>
                      <div className="text-xs text-slate-600/70 dark:text-slate-300/60">
                        Admin workspace
                      </div>
                    </div>
                  </div>

                  <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
                  <p className="text-sm text-slate-600/80 dark:text-slate-300/70">
                    Masuk untuk lanjut ke dashboard.
                  </p>
                </div>

                <ThemeToggle className="border-slate-200/70 bg-white/60 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" />
              </div>

              {err && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-200">
                  {err}
                </div>
              )}

              <button
                type="button"
                onClick={onGoogle}
                disabled={loading}
                className={cx(
                  "group w-full rounded-2xl border p-3 transition",
                  "border-slate-200/70 bg-white/60 hover:bg-white/80",
                  "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                  "disabled:opacity-60"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <Chrome className="h-4 w-4 opacity-80" />
                  <span className="text-sm font-medium">Login dengan Google</span>
                  <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-70" />
                </div>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px w-full bg-slate-200/70 dark:bg-white/10" />
                <span className="text-xs text-slate-500 dark:text-slate-400">atau</span>
                <div className="h-px w-full bg-slate-200/70 dark:bg-white/10" />
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={cx(
                        "w-full rounded-2xl border bg-white/60 pl-10 pr-3 py-3 text-sm outline-none transition",
                        "border-slate-200/70 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/15",
                        "dark:bg-white/5 dark:border-white/10 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/15"
                      )}
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={cx(
                        "w-full rounded-2xl border bg-white/60 pl-10 pr-3 py-3 text-sm outline-none transition",
                        "border-slate-200/70 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/15",
                        "dark:bg-white/5 dark:border-white/10 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/15"
                      )}
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <button
                  disabled={loading}
                  className={cx(
                    "group w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60",
                    "text-white",
                    "bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
                    "shadow-[0_12px_30px_-15px_rgba(99,102,241,0.6)]"
                  )}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {loading ? "Memproses..." : "Masuk"}
                    <ArrowRight className="h-4 w-4 opacity-80 transition group-hover:translate-x-0.5" />
                  </span>
                </button>

                <div className="flex items-center justify-between pt-1 text-sm">
                  <Link
                    href="/forgot-password"
                    className="text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline dark:text-slate-300 dark:hover:text-white"
                  >
                    Lupa password?
                  </Link>

                  <Link
                    href="/register"
                    className="text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline dark:text-sky-300 dark:hover:text-sky-200"
                  >
                    Daftar
                  </Link>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum punya akun?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-slate-800 underline-offset-4 hover:underline dark:text-slate-200"
                  >
                    Buat akun
                  </Link>
                </p>
              </form>

              <div className="pt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Dengan login, kamu setuju dengan kebijakan akses admin MyCMS.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
