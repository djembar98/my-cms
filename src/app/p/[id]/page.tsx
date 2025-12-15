"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ArrowLeft, MessageCircle, RefreshCw } from "lucide-react";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

type ProductRow = {
  id: string;
  name: string;
  category: string | null;
  type: string | null;
  description: string | null;
  image_url: string | null;
  wa_number: string;
  created_at: string;
};

type OfferRow = {
  id: string;
  product_id: string;
  label: string;
  unit: string;
  qty: number;
  price: number;
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

export default function PublicProductDetailPage() {
  const supabase = createSupabaseBrowserClient();
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);

  async function loadAll() {
    if (!productId) return;
    setLoading(true);

    const { data: p, error: pErr } = await supabase
      .from("products")
      .select("id,name,category,type,description,image_url,wa_number,created_at")
      .eq("id", productId)
      .maybeSingle();

    if (pErr) {
      alert(pErr.message);
      setProduct(null);
      setOffers([]);
      setLoading(false);
      return;
    }

    if (!p) {
      setProduct(null);
      setOffers([]);
      setLoading(false);
      return;
    }

    setProduct(p as ProductRow);

    const { data: o, error: oErr } = await supabase
      .from("product_offers")
      .select("id,product_id,label,unit,qty,price")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (!oErr) setOffers((o ?? []) as OfferRow[]);
    else setOffers([]);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function refresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  const minPrice = useMemo(() => {
    if (!offers.length) return null;
    return Math.min(...offers.map((x) => Number(x.price || 0)));
  }, [offers]);

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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/45 p-5 backdrop-blur-xl shadow-[0_20px_60px_-35px_rgba(2,6,23,0.35)] dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/45 px-3 py-2 text-sm font-semibold backdrop-blur-xl transition hover:bg-white/65 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>

            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/45 px-3 py-2 text-sm font-semibold backdrop-blur-xl transition hover:bg-white/65 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              {refreshing ? "Refresh…" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-slate-600/80 dark:text-slate-300/70">
              Loading…
            </div>
          ) : !product ? (
            <div className="mt-4">
              <div className="text-lg font-semibold">Produk tidak ditemukan</div>
              <div className="mt-1 text-sm text-slate-600/80 dark:text-slate-300/70">
                Mungkin produknya sudah dihapus.
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <div className="w-full overflow-hidden rounded-3xl border border-white/20 bg-white/40 dark:border-white/10 dark:bg-white/5">
  <div className="aspect-square w-full">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={product.image_url}
      alt={product.name}
      className="h-full w-full object-cover"
    />
  </div>
</div>
                ) : (
                  <div className="grid h-[240px] w-full place-items-center rounded-3xl border border-white/20 bg-white/35 text-sm text-slate-600/70 dark:border-white/10 dark:bg-white/5 dark:text-slate-300/70">
                    Tidak ada gambar
                  </div>
                )}

                <div className="mt-4 rounded-3xl border border-white/20 bg-white/35 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <div className="text-lg font-semibold tracking-tight">
                    {product.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-600/80 dark:text-slate-300/70">
                    {(CATEGORY_LABEL[product.category ?? ""] ?? product.category ?? "Others")}{" "}
                    • {product.type ?? "-"} • {timeAgo(product.created_at)}
                  </div>

                  {minPrice !== null && (
                    <div className="mt-3 text-sm text-slate-700/80 dark:text-slate-200/80">
                      Mulai{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Rp {formatRp(minPrice)}
                      </span>
                    </div>
                  )}

                  <div className="mt-4">
                    <a
                      href={waLink(
                        product.wa_number,
                        `Halo admin, saya mau order: ${product.name}. Bisa cek stok?`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className={cx(
                        "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
                        "bg-[linear-gradient(135deg,rgba(16,185,129,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
                        "shadow-[0_12px_30px_-15px_rgba(16,185,129,0.45)]"
                      )}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Order via WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                {product.description ? (
                  <div className="rounded-3xl border border-white/20 bg-white/35 p-4 text-sm text-slate-700/75 backdrop-blur-xl whitespace-pre-wrap dark:border-white/10 dark:bg-white/5 dark:text-slate-300/70">
                    {product.description}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600/80 dark:text-slate-300/70">
                    Tidak ada deskripsi.
                  </div>
                )}

                <div className="mt-5">
                  <div className="text-sm font-semibold">Paket / Harga</div>
                  <div className="mt-3 space-y-3">
                    {offers.length === 0 ? (
                      <div className="rounded-3xl border border-white/20 bg-white/35 p-4 text-sm text-slate-600/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-300/70">
                        Paket belum diisi.
                      </div>
                    ) : (
                      offers.map((o) => (
                        <div
                          key={o.id}
                          className="rounded-3xl border border-white/20 bg-white/35 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold">{o.label}</div>
                              <div className="mt-1 text-sm text-slate-600/80 dark:text-slate-300/70">
                                {o.qty} {o.unit} •{" "}
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  Rp {formatRp(o.price)}
                                </span>
                              </div>
                            </div>

                            <a
                              href={waLink(
                                product.wa_number,
                                `Halo admin, saya mau order: ${product.name}\nPaket: ${o.label}\n${o.qty} ${o.unit} • Rp ${formatRp(
                                  o.price
                                )}\n\nBisa cek stok?`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className={cx(
                                "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-white transition",
                                "bg-[linear-gradient(135deg,rgba(16,185,129,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]"
                              )}
                            >
                              <MessageCircle className="h-4 w-4" />
                              WA
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
