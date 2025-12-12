"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProductRow = {
  id: string;
  name: string;
  type: "sharing" | "private";
  image_url: string | null;
  wa_number: string;
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
  slug: string;
  published: boolean;
  cover_url: string | null;
  created_at: string;
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function unitLabel(unit: string, qty: number) {
  if (unit === "month") return `${qty} bulan`;
  if (unit === "year") return `${qty} tahun`;
  if (unit === "day") return `${qty} hari`;
  return `${qty} ${unit}`;
}

function buildWaLink(waNumber: string, message: string) {
  const wa = waNumber.replace(/\D/g, "");
  return `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
}

export default function HomePage() {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [offers, setOffers] = useState<Record<string, OfferRow[]>>({});
  const [selectedOffer, setSelectedOffer] = useState<Record<string, string>>(
    {}
  );

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  async function load() {
    setLoading(true);

    const {
      data: p,
      count: productCount,
      error: pErr,
    } = await supabase
      .from("products")
      .select("id,name,type,image_url,wa_number", { count: "exact" })
      .order("created_at", { ascending: false });

    if (pErr) {
      alert(pErr.message);
      setLoading(false);
      return;
    }

    const prod = (p ?? []) as ProductRow[];
    setProducts(prod);
    setTotalProducts(productCount ?? 0);

    const ids = prod.map((x) => x.id);
    if (ids.length > 0) {
      const { data: o, error: oErr } = await supabase
        .from("product_offers")
        .select("id,product_id,label,unit,qty,price")
        .in("product_id", ids)
        .order("created_at", { ascending: true });

      if (oErr) {
        alert(oErr.message);
      } else {
        const grouped: Record<string, OfferRow[]> = {};
        (o ?? []).forEach((row) => {
          const r = row as OfferRow;
          grouped[r.product_id] ||= [];
          grouped[r.product_id].push(r);
        });
        setOffers(grouped);

        const defaults: Record<string, string> = {};
        Object.entries(grouped).forEach(([pid, list]) => {
          if (list[0]) defaults[pid] = list[0].id;
        });
        setSelectedOffer(defaults);
      }
    } else {
      setOffers({});
    }

    const { data: postRows, error: postErr } = await supabase
      .from("posts")
      .select("id,title,slug,published,cover_url,created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .limit(6);

    if (postErr) {
      alert(postErr.message);
      setPosts([]);
      setTotalPosts(0);
    } else {
      setPosts((postRows ?? []) as PostRow[]);
      setTotalPosts((postRows ?? []).length);
    }

    setLoading(false);
  }

  async function trackClick(productId: string, offerId: string) {
    await supabase.from("order_clicks").insert({
      product_id: productId,
      offer_id: offerId,
    });
  }

  function onOrder(p: ProductRow) {
    const list = offers[p.id] ?? [];
    const chosenId = selectedOffer[p.id];
    const chosen = list.find((x) => x.id === chosenId) ?? list[0];
    if (!chosen)
      return alert("Paket belum ada. Tambahkan paket dulu di menu Jualan.");

    const msg = [
      `Halo admin, mau order ya 😊`,
      ``,
      `Produk: ${p.name}`,
      `Tipe: ${p.type.toUpperCase()}`,
      `Paket: ${chosen.label}`,
      `Durasi/Qty: ${unitLabel(chosen.unit, chosen.qty)}`,
      `Harga: ${formatRupiah(chosen.price)}`,
      ``,
      `Jangan lupa tanyakan stock dulu, yaa!♡♡`,
    ].join("\n");

    trackClick(p.id, chosen.id).catch(() => {});
    window.open(buildWaLink(p.wa_number, msg), "_blank");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
        <div className="text-lg font-semibold">Dashboard</div>
        <div className="text-sm text-black/60 dark:text-white/60">
          Ringkasan jualan & konten
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <div className="text-xs text-black/60 dark:text-white/60">
            Total Produk
          </div>
          <div className="text-2xl font-semibold">{totalProducts}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <div className="text-xs text-black/60 dark:text-white/60">
            Total Post
          </div>
          <div className="text-2xl font-semibold">{totalPosts}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <div className="text-xs text-black/60 dark:text-white/60">Status</div>
          <div className="text-sm font-medium">OK</div>
          <div className="text-xs text-black/60 dark:text-white/60">
            (nanti kita isi disk usage + warning)
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-black/60 dark:text-white/60">
          Loading...
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Jualan</div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Pilih paket lalu order via WhatsApp
              </div>
            </div>
            <Link
              href="/dashboard/jualan"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Kelola Jualan →
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
              <div className="font-semibold">Belum ada produk</div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Tambahkan produk di menu <b>Jualan</b>.
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.slice(0, 6).map((p) => {
                const list = offers[p.id] ?? [];
                const selected = selectedOffer[p.id] ?? list[0]?.id ?? "";

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border bg-white p-4 dark:bg-neutral-950"
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-40 w-full rounded-xl border object-cover"
                      />
                    ) : (
                      <div className="h-40 w-full rounded-xl border grid place-items-center text-sm text-black/60 dark:text-white/60">
                        No image
                      </div>
                    )}

                    <div className="mt-3">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        {p.type.toUpperCase()}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <select
                        className="w-full rounded-xl border p-3 bg-white text-black dark:bg-neutral-950 dark:text-white"
                        value={selected}
                        onChange={(e) =>
                          setSelectedOffer((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        disabled={list.length === 0}
                      >
                        {list.length === 0 ? (
                          <option value="">Belum ada paket</option>
                        ) : (
                          list.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label} • {unitLabel(o.unit, o.qty)} •{" "}
                              {formatRupiah(o.price)}
                            </option>
                          ))
                        )}
                      </select>

                      <button
                        onClick={() => onOrder(p)}
                        disabled={list.length === 0}
                        className="w-full rounded-xl bg-black p-3 text-white disabled:opacity-60 dark:bg-white dark:text-black"
                      >
                        Order WA
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-base font-semibold">Post Terbaru</div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Kelola konten blog
              </div>
            </div>
            <Link
              href="/dashboard/post"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Kelola Post →
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
              <div className="font-semibold">Belum ada post</div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Buat post di menu <b>Post</b>.
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border bg-white p-4 dark:bg-neutral-950"
                >
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={p.title}
                      className="h-40 w-full rounded-xl border object-cover"
                    />
                  ) : (
                    <div className="h-40 w-full rounded-xl border grid place-items-center text-sm text-black/60 dark:text-white/60">
                      No cover
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="font-semibold line-clamp-2">{p.title}</div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      /{p.slug} • {p.published ? "Published" : "Draft"}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/dashboard/post`}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm text-center hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/post`}
                      className="flex-1 rounded-lg bg-black px-3 py-2 text-sm text-white text-center dark:bg-white dark:text-black"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
