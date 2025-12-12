"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Box,
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

export default function StaticPage() {
  const supabase = createSupabaseBrowserClient();

  // === 2GB max (sesuai request kamu) ===
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

    // 1) COUNTS (lebih cepat pakai head:true)
    const [postsRes, productsRes, clicksRes] = await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase
        .from("order_clicks")
        .select("id", { count: "exact", head: true }),
    ]);

    if (!postsRes.error) setTotalPosts(postsRes.count ?? 0);
    if (!productsRes.error) setTotalProducts(productsRes.count ?? 0);
    if (!clicksRes.error) setTotalOrderClicks(clicksRes.count ?? 0);

    // 2) CLOUDINARY USAGE (via API route server-side)
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

    // 3) TOP CLICKED PRODUCTS (7 hari terakhir)
    try {
      const since = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      // ambil click rows (7 hari)
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
      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
        <div className="text-lg font-semibold">Static</div>
        <div className="text-sm text-black/60 dark:text-white/60">
          Ringkasan performa: total post, total produk, klik order, dan disk
          usage (Cloudinary).
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/post"
          className="rounded-2xl border bg-white p-5 hover:bg-black/5 dark:bg-neutral-950 dark:hover:bg-white/10 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Total Posts
              </div>
              <div className="text-2xl font-semibold">{totalPosts}</div>
            </div>
            <div className="h-10 w-10 rounded-xl border flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/jualan"
          className="rounded-2xl border bg-white p-5 hover:bg-black/5 dark:bg-neutral-950 dark:hover:bg-white/10 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Total Produk
              </div>
              <div className="text-2xl font-semibold">{totalProducts}</div>
            </div>
            <div className="h-10 w-10 rounded-xl border flex items-center justify-center">
              <Box size={18} />
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/jualan"
          className="rounded-2xl border bg-white p-5 hover:bg-black/5 dark:bg-neutral-950 dark:hover:bg-white/10 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Klik Order
              </div>
              <div className="text-2xl font-semibold">{totalOrderClicks}</div>
            </div>
            <div className="h-10 w-10 rounded-xl border flex items-center justify-center">
              <MousePointerClick size={18} />
            </div>
          </div>
        </Link>
      </div>

      {/* Disk usage */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl border flex items-center justify-center">
              <HardDrive size={18} />
            </div>
            <div>
              <div className="font-semibold">Disk Usage (Cloudinary)</div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Maksimum ditampilkan: <b>2 GB</b>
              </div>
            </div>
          </div>

          <button
            onClick={loadAll}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="text-black/60 dark:text-white/60">
              Terpakai: <b>{formatBytes(diskBytes)}</b> /{" "}
              <b>{formatBytes(MAX_BYTES)}</b>
            </div>
            <div className="font-medium">{diskPercent.toFixed(0)}%</div>
          </div>

          <div className="h-3 w-full rounded-full border bg-black/5 dark:bg-white/10 overflow-hidden">
            <div
              className={[
                "h-full rounded-full transition-all",
                diskState === "critical"
                  ? "bg-red-500"
                  : diskState === "warning"
                  ? "bg-yellow-500"
                  : "bg-emerald-500",
              ].join(" ")}
              style={{ width: `${diskPercent}%` }}
            />
          </div>

          {diskState !== "ok" && (
            <div className="mt-2 flex items-start gap-2 rounded-xl border p-3 text-sm">
              <AlertTriangle size={18} className="mt-0.5" />
              <div>
                <div className="font-medium">
                  {diskState === "critical"
                    ? "Disk hampir penuh"
                    : "Disk mulai penuh"}
                </div>
                <div className="text-black/60 dark:text-white/60">
                  Kurangi upload / hapus asset yang tidak dipakai supaya tetap
                  lancar.
                </div>
              </div>
            </div>
          )}

          {diskErr && (
            <div className="text-sm text-red-500">Error: {diskErr}</div>
          )}
        </div>
      </div>

      {/* Top clicked */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
        <div className="font-semibold">
          Top Produk Paling Sering Diklik (7 hari)
        </div>
        <div className="text-sm text-black/60 dark:text-white/60">
          Berdasarkan tabel <code>order_clicks</code>.
        </div>

        {loading ? (
          <div className="mt-3 text-sm text-black/60 dark:text-white/60">
            Loading...
          </div>
        ) : topClicked.length === 0 ? (
          <div className="mt-3 text-sm text-black/60 dark:text-white/60">
            Belum ada klik order dalam 7 hari terakhir.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {topClicked.map((x) => {
              const pct = (x.clicks / maxClicks) * 100;
              return (
                <div key={x.productId} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{x.name}</div>
                    <div className="text-sm text-black/60 dark:text-white/60">
                      {x.clicks} klik
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-black dark:bg-white"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-2">
                    <Link
                      href={`/dashboard/jualan/${x.productId}`}
                      className="text-sm underline text-black/70 dark:text-white/70"
                    >
                      Buka produk
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
