"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Boxes,
  FileText,
  MousePointerClick,
  HardDrive,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

type TopClicked = {
  productId: string;
  name: string;
  clicks: number;
};

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatBytes(bytes: number) {
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  const kb = bytes / 1024;
  if (kb >= 1) return `${kb.toFixed(0)} KB`;
  return `${bytes} B`;
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
  children,
  className,
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
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

function StatCard({
  href,
  label,
  value,
  icon,
}: {
  href: string;
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "group rounded-3xl border p-5 transition",
        "border-white/20 bg-white/50 hover:bg-white/70",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={cx("text-xs", subtleText)}>{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">
            {value}
          </div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
          {icon}
        </div>
      </div>
    </Link>
  );
}

function Bar({
  percent,
  state,
}: {
  percent: number;
  state: "ok" | "warning" | "critical";
}) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full border border-white/20 bg-white/30 dark:border-white/10 dark:bg-white/5">
      <div
        className={cx(
          "h-full rounded-full transition-all",
          state === "critical"
            ? "bg-rose-500"
            : state === "warning"
            ? "bg-amber-500"
            : "bg-emerald-500"
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------- */

export default function StaticPage() {
  const supabase = createSupabaseBrowserClient();

  // 2GB max
  const MAX_BYTES = 2 * 1024 * 1024 * 1024;

  const [loading, setLoading] = useState(true);

  const [totalPosts, setTotalPosts] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrderClicks, setTotalOrderClicks] = useState(0);

  const [diskBytes, setDiskBytes] = useState<number>(0);
  const [diskErr, setDiskErr] = useState<string | null>(null);

  const [topClicked, setTopClicked] = useState<TopClicked[]>([]);

  const diskPercent = useMemo(() => {
    const p = (diskBytes / MAX_BYTES) * 100;
    return clamp(Number.isFinite(p) ? p : 0, 0, 100);
  }, [diskBytes, MAX_BYTES]);

  const diskState = useMemo(() => {
    if (diskPercent >= 95) return "critical";
    if (diskPercent >= 85) return "warning";
    return "ok";
  }, [diskPercent]);

  async function loadAll() {
    setLoading(true);
    setDiskErr(null);

    const [postsRes, productsRes, clicksRes] = await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("order_clicks").select("id", { count: "exact", head: true }),
    ]);

    if (!postsRes.error) setTotalPosts(postsRes.count ?? 0);
    if (!productsRes.error) setTotalProducts(productsRes.count ?? 0);
    if (!clicksRes.error) setTotalOrderClicks(clicksRes.count ?? 0);

    // Cloudinary usage
    try {
      const r = await fetch("/api/cloudinary/usage", { cache: "no-store" });
      if (!r.ok) throw new Error(`Cloudinary usage error: ${r.status}`);
      const json = (await r.json()) as { bytes?: unknown };

      const bytes =
        typeof json.bytes === "number"
          ? json.bytes
          : typeof json.bytes === "string"
          ? Number(json.bytes)
          : 0;

      setDiskBytes(Number.isFinite(bytes) ? Math.max(0, bytes) : 0);
    } catch (e) {
      setDiskErr(e instanceof Error ? e.message : "Gagal ambil disk usage");
      setDiskBytes(0);
    }

    // Top clicked products (7 hari)
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: clickRows, error: clickErr } = await supabase
        .from("order_clicks")
        .select("product_id,created_at")
        .gte("created_at", since)
        .limit(5000);

      if (clickErr) throw clickErr;

      const counts = new Map<string, number>();
      (clickRows ?? []).forEach((row) => {
        const pid = (row as { product_id?: unknown }).product_id;
        if (typeof pid !== "string") return;
        counts.set(pid, (counts.get(pid) ?? 0) + 1);
      });

      const ids = Array.from(counts.keys());
      if (ids.length === 0) {
        setTopClicked([]);
      } else {
        const { data: prods, error: prodErr } = await supabase
          .from("products")
          .select("id,name")
          .in("id", ids);

        if (prodErr) throw prodErr;

        const nameById = new Map<string, string>();
        (prods ?? []).forEach((p) => {
          const id = (p as { id?: unknown }).id;
          const name = (p as { name?: unknown }).name;
          if (typeof id === "string" && typeof name === "string") {
            nameById.set(id, name);
          }
        });

        const top = ids
          .map((id) => ({
            productId: id,
            name: nameById.get(id) ?? "Unknown",
            clicks: counts.get(id) ?? 0,
          }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 8);

        setTopClicked(top);
      }
    } catch {
      setTopClicked([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxClicks = useMemo(() => {
    return topClicked.reduce((m, x) => Math.max(m, x.clicks), 0) || 1;
  }, [topClicked]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-5 sm:p-6">
        <div className="text-lg font-semibold tracking-tight">Static</div>
        <div className={cx("mt-1 text-sm", subtleText)}>
          Ringkasan performa: total post, total produk, klik order, dan disk usage
          (Cloudinary).
        </div>
      </GlassCard>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          href="/dashboard/post"
          label="Total Posts"
          value={totalPosts}
          icon={<FileText className="h-4 w-4 opacity-80" />}
        />
        <StatCard
          href="/dashboard/jualan"
          label="Total Produk"
          value={totalProducts}
          icon={<Boxes className="h-4 w-4 opacity-80" />}
        />
        <StatCard
          href="/dashboard/jualan"
          label="Klik Order"
          value={totalOrderClicks}
          icon={<MousePointerClick className="h-4 w-4 opacity-80" />}
        />
      </div>

      {/* Disk usage */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/40 dark:border-white/10 dark:bg-white/5">
              <HardDrive className="h-4 w-4 opacity-80" />
            </div>

            <div>
              <div className="font-semibold tracking-tight">Disk Usage (Cloudinary)</div>
              <div className={cx("text-sm", subtleText)}>
                Maksimum ditampilkan: <span className="font-semibold">2 GB</span>
              </div>
            </div>
          </div>

          <SoftButton onClick={loadAll} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </SoftButton>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className={subtleText}>
              Terpakai: <span className="font-semibold">{formatBytes(diskBytes)}</span>{" "}
              / <span className="font-semibold">{formatBytes(MAX_BYTES)}</span>
            </div>
            <div className="font-medium">{diskPercent.toFixed(0)}%</div>
          </div>

          <Bar percent={diskPercent} state={diskState} />

          {diskState !== "ok" && (
            <div
              className={cx(
                "mt-3 flex items-start gap-2 rounded-2xl border p-3 text-sm",
                "border-white/20 bg-white/40",
                "dark:border-white/10 dark:bg-white/5"
              )}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 opacity-80" />
              <div>
                <div className="font-medium">
                  {diskState === "critical" ? "Disk hampir penuh" : "Disk mulai penuh"}
                </div>
                <div className={cx("mt-0.5", subtleText)}>
                  Kurangi upload / hapus asset yang tidak dipakai supaya tetap lancar.
                </div>
              </div>
            </div>
          )}

          {diskErr && (
            <div className="text-sm text-rose-600 dark:text-rose-300">
              Error: {diskErr}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Top clicked */}
      <GlassCard className="p-5 sm:p-6">
        <div className="font-semibold tracking-tight">
          Top Produk Paling Sering Diklik (7 hari)
        </div>
        <div className={cx("text-sm", subtleText)}>
          Berdasarkan tabel <code className="rounded bg-white/40 px-1 py-0.5 text-[12px] dark:bg-white/10">
            order_clicks
          </code>
          .
        </div>

        {loading ? (
          <div className={cx("mt-3 text-sm", subtleText)}>Loading...</div>
        ) : topClicked.length === 0 ? (
          <div className={cx("mt-3 text-sm", subtleText)}>
            Belum ada klik order dalam 7 hari terakhir.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {topClicked.map((x) => {
              const pct = (x.clicks / maxClicks) * 100;

              return (
                <div
                  key={x.productId}
                  className={cx(
                    "rounded-3xl border p-4 transition",
                    "border-white/20 bg-white/40 hover:bg-white/60",
                    "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium truncate">{x.name}</div>
                    <div className={cx("text-sm", subtleText)}>{x.clicks} klik</div>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-white/20 bg-white/30 dark:border-white/10 dark:bg-white/5">
                    <div
                      className="h-full rounded-full bg-slate-900/70 dark:bg-white/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/dashboard/jualan/${x.productId}`}
                      className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
                    >
                      Buka produk
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
