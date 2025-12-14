"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Search,
  ShoppingBag,
  Sparkles,
  Megaphone,
  MessageCircle,
  Filter,
} from "lucide-react";
import Image from "next/image";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

type ProductRow = {
  id: string;
  name: string;
  category: string | null;
  type: string;
  description: string | null;
  image_url: string | null;
  wa_number: string;
  created_at: string;

  // ✅ new badge fields
  promo: boolean;
  promo_text: string | null;
  garansi: boolean;
  support_device: boolean;
};

type OfferRow = {
  id: string;
  product_id: string;
  label: string;
  unit: string;
  qty: number;
  price: number;
};

type PostRow = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  STREAMING: "Streaming",
  EDITING: "Editing",
  EDUCATIONAL: "Educational",
  TOPUP_GAME: "Topup Game",
  SOCIAL_NEEDS: "Social Needs",
  JASA: "Jasa",
  OTHERS: "Others",
};

function formatRp(n: number) {
  try {
    return new Intl.NumberFormat("id-ID").format(n);
  } catch {
    return String(n);
  }
}

function waLink(waNumber: string, message: string) {
  const digits = (waNumber || "").replace(/[^\d]/g, "");
  const m = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${m}`;
}

function timeAgo(dateISO: string) {
  const d = new Date(dateISO).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}

type FeatureKey = "garansi" | "support_device" | "promo";
function pillFeatureClass(kind: FeatureKey) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur-xl";
  switch (kind) {
    case "promo":
      return [
        base,
        "border-fuchsia-300/40 bg-fuchsia-200/30 text-fuchsia-900",
        "dark:border-fuchsia-400/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-200",
      ].join(" ");
    case "garansi":
      return [
        base,
        "border-emerald-300/40 bg-emerald-200/30 text-emerald-900",
        "dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200",
      ].join(" ");
    case "support_device":
      return [
        base,
        "border-sky-300/40 bg-sky-200/30 text-sky-900",
        "dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-200",
      ].join(" ");
  }
}

export default function HomePage() {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [offers, setOffers] = useState<Record<string, OfferRow[]>>({});
  const [posts, setPosts] = useState<PostRow[]>([]);

  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string>("ALL");

  async function load() {
    setLoading(true);

    const { data: p, error: pErr } = await supabase
      .from("products")
      .select(
        "id,name,category,type,description,image_url,wa_number,created_at,promo,promo_text,garansi,support_device"
      )
      .order("created_at", { ascending: false });

    if (pErr) {
      alert(pErr.message);
      setLoading(false);
      return;
    }

    const prod = (p ?? []) as ProductRow[];
    setProducts(prod);

    const ids = prod.map((x) => x.id);
    if (ids.length) {
      const { data: o, error: oErr } = await supabase
        .from("product_offers")
        .select("id,product_id,label,unit,qty,price")
        .in("product_id", ids)
        .order("created_at", { ascending: true });

      if (!oErr) {
        const grouped: Record<string, OfferRow[]> = {};
        (o ?? []).forEach((row) => {
          const r = row as OfferRow;
          grouped[r.product_id] ||= [];
          grouped[r.product_id].push(r);
        });
        setOffers(grouped);
      } else {
        setOffers({});
      }
    } else {
      setOffers({});
    }

    const { data: ps, error: psErr } = await supabase
      .from("posts")
      .select("id,title,content,image_url,created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    if (!psErr) setPosts((ps ?? []) as PostRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    const arr = Array.from(set);
    arr.sort((a, b) =>
      (CATEGORY_LABEL[a] ?? a).localeCompare(CATEGORY_LABEL[b] ?? b)
    );
    return arr;
  }, [products]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      const okCat =
        activeCat === "ALL" ? true : (p.category ?? "OTHERS") === activeCat;
      if (!okCat) return false;
      if (!query) return true;
      const hay = `${p.name} ${(p.type || "")} ${(p.description || "")}`.toLowerCase();
      return hay.includes(query);
    });
  }, [products, q, activeCat]);

  const stats = useMemo(() => {
    const totalOffers = Object.values(offers).reduce(
      (acc, list) => acc + list.length,
      0
    );
    return {
      products: products.length,
      offers: totalOffers,
      posts: posts.length,
    };
  }, [products.length, offers, posts.length]);

  const footerWADigits = products[0]?.wa_number || "";

  return (
    <main
      className={cx(
        "min-h-screen",
        "bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(56,189,248,0.20),transparent_55%),radial-gradient(1100px_circle_at_80%_20%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(900px_circle_at_70%_85%,rgba(16,185,129,0.12),transparent_55%)]",
        "bg-slate-50 text-slate-900",
        "dark:bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(1100px_circle_at_80%_20%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(900px_circle_at_70%_85%,rgba(16,185,129,0.08),transparent_55%)]",
        "dark:bg-[#0b1020] dark:text-slate-100"
      )}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/20 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-white/25 bg-white/45 shadow-sm dark:border-white/10 dark:bg-white/5">
              <Image
                src="/logo.jpg"
                alt="Sthev`s Stuffs"
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
                priority
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Sthev`s Stuffs</div>
              <div className="text-xs text-slate-600/70 dark:text-slate-300/60">
                Tanya stok dulu ya ✨
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="#jualans"
              className="hidden sm:inline-flex rounded-xl px-3 py-2 text-sm text-slate-700/80 hover:bg-white/40 dark:text-slate-200/80 dark:hover:bg-white/10"
            >
              Jualan
            </a>
            <a
              href="#posts"
              className="hidden sm:inline-flex rounded-xl px-3 py-2 text-sm text-slate-700/80 hover:bg-white/40 dark:text-slate-200/80 dark:hover:bg-white/10"
            >
              Post
            </a>

            <Link
              href="/login"
              className={cx(
                "group inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition",
                "bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
                "shadow-[0_12px_30px_-15px_rgba(99,102,241,0.55)]"
              )}
            >
              Admin Login
              <ArrowRight className="h-4 w-4 opacity-90 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/50 px-3 py-1 text-xs font-medium text-slate-700/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-200/80">
              <Sparkles className="h-3.5 w-3.5" />
              Premium apps • Topup game • Sosmed • Jasa
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Pilih yang kamu butuh,
              <span className="text-slate-700/80 dark:text-slate-200/80">
                {" "}
                order via WhatsApp
              </span>
              .
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-700/70 dark:text-slate-300/70">
              Semua produk ditampilkan dalam card yang rapi. Lihat paket harga (offers),
              lalu klik “Order WA” untuk chat admin.
            </p>

            <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
              {[
                { icon: <ShoppingBag className="h-4 w-4" />, t: `${stats.products}`, s: "Produk" },
                { icon: <Filter className="h-4 w-4" />, t: `${stats.offers}`, s: "Paket" },
                { icon: <Megaphone className="h-4 w-4" />, t: `${stats.posts}`, s: "Update" },
              ].map((x) => (
                <div
                  key={x.s}
                  className="rounded-2xl border border-white/25 bg-white/45 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center gap-2 text-slate-700/80 dark:text-slate-200/80">
                    {x.icon}
                    <div className="text-lg font-semibold leading-none">{x.t}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600/70 dark:text-slate-300/60">
                    {x.s}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={cx(
                    "w-full rounded-2xl border bg-white/55 pl-10 pr-3 py-3 text-sm outline-none transition",
                    "border-slate-200/70 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/15",
                    "dark:bg-white/5 dark:border-white/10 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/15"
                  )}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari: netflix, canva, robux, followers, dll…"
                />
              </div>

              <button
                type="button"
                onClick={load}
                className={cx(
                  "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                  "border-slate-200/70 bg-white/55 hover:bg-white/75",
                  "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                )}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/20 bg-white/45 p-5 backdrop-blur-xl shadow-[0_20px_60px_-35px_rgba(2,6,23,0.35)] dark:border-white/10 dark:bg-white/5">
              <div className="text-sm font-semibold">Cara order</div>
              <ol className="mt-3 space-y-2 text-sm text-slate-700/75 dark:text-slate-300/70">
                <li className="flex gap-2">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/70 text-xs font-semibold dark:bg-white/10">
                    1
                  </span>
                  Pilih produk & paketnya (offers).
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/70 text-xs font-semibold dark:bg-white/10">
                    2
                  </span>
                  Klik tombol <b>Order WA</b> untuk chat admin.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/70 text-xs font-semibold dark:bg-white/10">
                    3
                  </span>
                  Jangan lupa <b>tanya stok</b> dulu ya ✨
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Jualan */}
      <section id="jualans" className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Jualan</div>
            <div className="text-sm text-slate-600/80 dark:text-slate-300/70">
              Utama — tampilkan produk dalam card grid yang enak dilihat.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCat("ALL")}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                activeCat === "ALL"
                  ? "border-transparent text-white bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))]"
                  : "border-slate-200/70 bg-white/50 hover:bg-white/75 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              )}
            >
              Semua
            </button>

            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  activeCat === c
                    ? "border-transparent text-white bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))]"
                    : "border-slate-200/70 bg-white/50 hover:bg-white/75 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                )}
              >
                {CATEGORY_LABEL[c] ?? c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[170px] animate-pulse rounded-3xl border border-white/20 bg-white/35 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-white/20 bg-white/45 p-6 text-sm text-slate-700/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-300/70">
              Tidak ada produk yang cocok.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const list = offers[p.id] ?? [];
                const min = list.length
                  ? Math.min(...list.map((x) => Number(x.price || 0)))
                  : null;

                const cat = p.category ?? "OTHERS";
                const catLabel = CATEGORY_LABEL[cat] ?? cat;

                const msg = `Halo admin, saya mau order: ${p.name} (${p.type}). Bisa cek stok?`;
                const hrefWA = waLink(p.wa_number, msg);

                const showPromo = !!p.promo;
                const promoText = (p.promo_text || "").trim() || "Promo";

                return (
                  <div
                    key={p.id}
                    className={cx(
                      "group relative overflow-hidden rounded-3xl border border-white/20 bg-white/45 p-4 backdrop-blur-xl",
                      "shadow-[0_20px_60px_-35px_rgba(2,6,23,0.35)]",
                      "transition hover:-translate-y-0.5 hover:bg-white/60",
                      "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    )}
                  >
                    <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_60%)] opacity-0 transition group-hover:opacity-100" />

                    <div className="flex items-start gap-3">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-14 w-14 shrink-0 rounded-2xl border border-white/30 object-cover dark:border-white/10"
                        />
                      ) : (
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/40 text-xs font-semibold dark:border-white/10 dark:bg-white/5">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.name}</div>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/20 bg-white/40 px-2 py-0.5 text-[11px] font-medium text-slate-700/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-200/80">
                            {p.type.toLowerCase()}
                          </span>
                          <span className="rounded-full border border-white/20 bg-white/40 px-2 py-0.5 text-[11px] font-medium text-slate-700/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-200/80">
                            {catLabel}
                          </span>
                        </div>

                        {/* ✅ Badges dinamis */}
                        {(p.garansi || p.support_device || showPromo) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {p.garansi && (
                              <span className={pillFeatureClass("garansi")}>
                                ✅ Garansi
                              </span>
                            )}
                            {p.support_device && (
                              <span className={pillFeatureClass("support_device")}>
                                📱 Support device
                              </span>
                            )}
                            {showPromo && (
                              <span className={pillFeatureClass("promo")}>
                                ✨ {promoText}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-2 text-xs text-slate-600/70 dark:text-slate-300/60">
                          {min !== null ? (
                            <span>
                              Mulai{" "}
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                Rp {formatRp(min)}
                              </span>
                            </span>
                          ) : (
                            <span className="italic">Paket belum diisi</span>
                          )}
                          <span className="mx-2">•</span>
                          <span>{timeAgo(p.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {p.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-slate-700/75 dark:text-slate-300/70">
                        {p.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        href={`/p/${p.id}`}
                        className={cx(
                          "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                          "border-slate-200/70 bg-white/55 hover:bg-white/80",
                          "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                        )}
                      >
                        Lihat detail
                        <ArrowRight className="h-4 w-4 opacity-80" />
                      </Link>

                      <a
                        href={hrefWA}
                        target="_blank"
                        rel="noreferrer"
                        className={cx(
                          "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition",
                          "bg-[linear-gradient(135deg,rgba(16,185,129,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
                          "shadow-[0_12px_30px_-15px_rgba(16,185,129,0.45)]"
                        )}
                        title="Order via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WA
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer (tetap seperti punyamu) */}
      <footer className="border-t border-white/20 bg-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-white/25 bg-white/45 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <Image
                    src="/logo.jpg"
                    alt="Sthev`s Stuffs"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Sthev`s Stuffs</div>
                  <div className="text-xs text-slate-600/70 dark:text-slate-300/60">
                    Tanya stok dulu ya ✨
                  </div>
                </div>
              </div>

              <p className="mt-3 max-w-md text-sm text-slate-700/70 dark:text-slate-300/70">
                Produk rapi, paket jelas, order cepat via WhatsApp. Update terbaru juga
                tersedia di bagian Post.
              </p>

              {footerWADigits ? (
                <a
                  href={waLink(footerWADigits, "Halo admin, saya mau tanya stok 😊")}
                  target="_blank"
                  rel="noreferrer"
                  className={cx(
                    "mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition",
                    "bg-[linear-gradient(135deg,rgba(16,185,129,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
                    "shadow-[0_12px_30px_-15px_rgba(16,185,129,0.45)]"
                  )}
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat Admin
                </a>
              ) : (
                <div className="mt-4 text-xs text-slate-600/70 dark:text-slate-300/60">
                  Kontak WhatsApp belum tersedia.
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <div className="text-sm font-semibold">Menu</div>
              <div className="mt-3 space-y-2 text-sm">
                <a
                  href="#jualans"
                  className="inline-flex rounded-xl px-2 py-1 text-slate-700/75 hover:bg-white/40 dark:text-slate-300/70 dark:hover:bg-white/10"
                >
                  Jualan
                </a>
                <a
                  href="#posts"
                  className="inline-flex rounded-xl px-2 py-1 text-slate-700/75 hover:bg-white/40 dark:text-slate-300/70 dark:hover:bg-white/10"
                >
                  Post
                </a>
                <Link
                  href="/login"
                  className="inline-flex rounded-xl px-2 py-1 text-slate-700/75 hover:bg-white/40 dark:text-slate-300/70 dark:hover:bg-white/10"
                >
                  Admin Login
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="text-sm font-semibold">Info</div>
              <div className="mt-3 rounded-3xl border border-white/20 bg-white/35 p-4 text-sm text-slate-700/70 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-300/70">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      Jam respon
                    </div>
                    <div className="mt-1">09.00–22.00 WIB</div>
                  </div>
                </div>
                <div className="mt-3 h-px bg-white/30 dark:bg-white/10" />
                <div className="mt-3 text-xs">
                  Dengan order, kamu setuju dengan ketentuan layanan store.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/20 pt-5 text-xs text-slate-600/70 dark:border-white/10 dark:text-slate-300/60 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Sthev`s Stuffs. All rights reserved.</div>
            <div className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 opacity-70" />
              Fast checkout via WA
            </div>
          </div>
        </div>
      </footer>

      {footerWADigits ? (
        <a
          href={waLink(footerWADigits, "Halo admin, saya mau tanya stok 😊")}
          target="_blank"
          rel="noreferrer"
          className={cx(
            "fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white",
            "bg-[linear-gradient(135deg,rgba(16,185,129,0.95),rgba(56,189,248,0.95))]",
            "shadow-[0_18px_40px_-18px_rgba(16,185,129,0.55)]"
          )}
        >
          <MessageCircle className="h-4 w-4" />
          Chat Admin
        </a>
      ) : null}
    </main>
  );
}
