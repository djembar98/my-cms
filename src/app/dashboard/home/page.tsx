"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Boxes,
  FileText,
  Plus,
  Settings,
  TrendingUp,
} from "lucide-react";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

type ProductRow = {
  id: string;
  name: string;
  type: string;
  image_url: string | null;
  wa_number: string;
  created_at: string;
};

type PostRow = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  cover_url: string | null;
  created_at: string;
};

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warn";
}) {
  const toneCls =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
      : tone === "warn"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
      : "border-slate-200/70 bg-white/60 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-2xl border px-2.5 py-1 text-[11px] font-medium",
        "backdrop-blur-md",
        toneCls
      )}
    >
      {children}
    </span>
  );
}

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
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "group inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
        "border-slate-200/70 bg-white/60 hover:bg-white/80",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
        className
      )}
    >
      {children}
    </Link>
  );
}

function PrimaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "group inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
        "text-white",
        "bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
        "shadow-[0_12px_30px_-15px_rgba(99,102,241,0.55)]",
        className
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 opacity-85 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function DashboardHomePage() {
  const supabase = createSupabaseBrowserClient();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const { data: p } = await supabase
      .from("products")
      .select("id,name,type,image_url,wa_number,created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    const { data: t } = await supabase
      .from("posts")
      .select("id,title,slug,published,cover_url,created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    setProducts((p ?? []) as ProductRow[]);
    setPosts((t ?? []) as PostRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className={cx(
        "min-h-[calc(100vh-0px)] w-full",
        "text-slate-900 dark:text-slate-100",
        "bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.08),transparent_55%)]",
        "bg-slate-50",
        "dark:bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.07),transparent_55%)]",
        "dark:bg-[#0b1020]"
      )}
    >
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
                  <TrendingUp className="h-4 w-4 opacity-80" />
                </div>
                <div className="text-lg font-semibold tracking-tight">
                  Dashboard
                </div>
              </div>
              <div className="text-sm text-slate-600/80 dark:text-slate-300/70">
                Ringkas, fokus, dan rapi — prioritas jualan.
              </div>
            </div>

            <PrimaryButton href="/dashboard/jualan">
              Kelola Jualan
            </PrimaryButton>
          </div>
        </GlassCard>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-600/80 dark:text-slate-300/70">
                  Products
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  {loading ? "…" : products.length}
                </div>
                <div className="mt-1 text-xs text-slate-600/70 dark:text-slate-300/60">
                  Terbaru ditampilkan
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
                <Boxes className="h-4 w-4 opacity-80" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-600/80 dark:text-slate-300/70">
                  Posts
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  {loading ? "…" : posts.length}
                </div>
                <div className="mt-1 text-xs text-slate-600/70 dark:text-slate-300/60">
                  Terbaru ditampilkan
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
                <FileText className="h-4 w-4 opacity-80" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-600/80 dark:text-slate-300/70">
                  Quick
                </div>
                <div className="mt-1 text-sm text-slate-600/80 dark:text-slate-300/70">
                  Aksi cepat untuk kerja harian.
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
                <Plus className="h-4 w-4 opacity-80" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <SoftButton href="/dashboard/jualan">
                <Plus className="h-4 w-4 opacity-80" />
                Tambah produk
              </SoftButton>
              <SoftButton href="/dashboard/post">
                <Plus className="h-4 w-4 opacity-80" />
                Buat post
              </SoftButton>
              <SoftButton href="/dashboard/static">
                <TrendingUp className="h-4 w-4 opacity-80" />
                Lihat statistik
              </SoftButton>
              <SoftButton href="/dashboard/settings">
                <Settings className="h-4 w-4 opacity-80" />
                Settings
              </SoftButton>
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold tracking-tight">
                  Jualan Terbaru
                </div>
                <div className="text-sm text-slate-600/80 dark:text-slate-300/70">
                  Klik untuk detail & paket harga
                </div>
              </div>

              <Link
                href="/dashboard/jualan"
                className={cx(
                  "rounded-2xl px-3 py-2 text-sm font-medium transition",
                  "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                  "dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5"
                )}
              >
                Lihat semua
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(loading ? Array.from({ length: 6 }) : products).map((p, idx) => {
                const key = loading ? `skp-${idx}` : (p as ProductRow).id;
                const item = p as ProductRow;

                return (
                  <Link
                    key={key}
                    href={loading ? "#" : `/dashboard/jualan/${item.id}`}
                    className={cx(
                      "group rounded-3xl border p-4 transition",
                      "border-white/20 bg-white/40 hover:bg-white/60",
                      "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                      loading && "pointer-events-none"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {loading ? (
                        <div className="h-12 w-12 rounded-2xl bg-slate-200/70 dark:bg-white/10 animate-pulse" />
                      ) : item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          className="h-12 w-12 rounded-2xl border border-white/20 object-cover dark:border-white/10"
                          alt={item.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl border border-white/20 bg-white/30 dark:border-white/10 dark:bg-white/5" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {loading ? (
                            <div className="h-4 w-3/4 rounded bg-slate-200/70 dark:bg-white/10 animate-pulse" />
                          ) : (
                            item.name
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {loading ? (
                            <>
                              <div className="h-5 w-20 rounded-2xl bg-slate-200/70 dark:bg-white/10 animate-pulse" />
                              <div className="h-5 w-24 rounded-2xl bg-slate-200/70 dark:bg-white/10 animate-pulse" />
                            </>
                          ) : (
                            <>
                              <Pill>{item.type}</Pill>
                              <Pill>WA: {item.wa_number}</Pill>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold tracking-tight">Post Terbaru</div>
                <div className="text-sm text-slate-600/80 dark:text-slate-300/70">
                  Draft / Published
                </div>
              </div>

              <Link
                href="/dashboard/post"
                className={cx(
                  "rounded-2xl px-3 py-2 text-sm font-medium transition",
                  "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                  "dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5"
                )}
              >
                Lihat semua
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {(loading ? Array.from({ length: 6 }) : posts).map((x, idx) => {
                const key = loading ? `skt-${idx}` : (x as PostRow).id;
                const item = x as PostRow;

                return (
                  <Link
                    key={key}
                    href={loading ? "#" : `/dashboard/post/${item.id}`}
                    className={cx(
                      "group rounded-3xl border p-4 transition",
                      "border-white/20 bg-white/40 hover:bg-white/60",
                      "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                      loading && "pointer-events-none"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {loading ? (
                            <div className="h-4 w-64 max-w-[70%] rounded bg-slate-200/70 dark:bg-white/10 animate-pulse" />
                          ) : (
                            item.title
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-600/70 dark:text-slate-300/60 truncate">
                          {loading ? (
                            <div className="h-3 w-40 rounded bg-slate-200/70 dark:bg-white/10 animate-pulse" />
                          ) : (
                            `/${item.slug}`
                          )}
                        </div>
                      </div>

                      {loading ? (
                        <div className="h-5 w-20 rounded-2xl bg-slate-200/70 dark:bg-white/10 animate-pulse" />
                      ) : (
                        <Pill tone={item.published ? "success" : "warn"}>
                          {item.published ? "Published" : "Draft"}
                        </Pill>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
