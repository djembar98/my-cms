"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
      email,
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
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

    setLoading(false);
    if (error) setErr(error.message);
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6 space-y-4">
        <h1 className="text-xl font-semibold">Login</h1>

        {err && <p className="text-sm text-red-500">{err}</p>}

        <button
          type="button"
          onClick={onGoogle}
          disabled={loading}
          className="w-full rounded-lg border p-3 hover:bg-gray-50 disabled:opacity-60"
        >
          Login dengan Google
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px w-full bg-gray-200" />
          <span className="text-xs text-gray-500">atau</span>
          <div className="h-px w-full bg-gray-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            disabled={loading}
            className="w-full rounded-lg bg-black text-white p-3 disabled:opacity-60"
          >
            Masuk
          </button>
        </form>

        <div className="flex items-center justify-between text-sm pt-2">
          <a
            href="/forgot-password"
            className="underline text-black/70 dark:text-white/70"
          >
            Lupa password?
          </a>
          <a href="/register" className="underline font-medium">
            Daftar
          </a>
        </div>

        <p className="text-xs text-black/60 dark:text-white/60">
          Belum punya akun?{" "}
          <a href="/register" className="underline font-medium">
            Buat akun
          </a>
        </p>
      </div>
    </main>
  );
}
