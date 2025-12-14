"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  use as usePromise,
  FormEvent,
} from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CoverUpload } from "@/components/cloudinary/cover-upload";
import {
  ArrowLeft,
  Pencil,
  Save,
  Trash2,
  RefreshCw,
  Plus,
  MessageCircle,
  X,
} from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  type: string;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
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
  created_at?: string;
};

const UNITS = [
  { value: "month", label: "month (bulan)" },
  { value: "robux", label: "robux" },
  { value: "uc", label: "uc" },
  { value: "page", label: "page" },
  { value: "followers", label: "followers" },
  { value: "likes", label: "likes" },
  { value: "views", label: "views" },
  { value: "item", label: "item (lainnya)" },
] as const;

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

function onlyDigits(s: string) {
  return (s || "").replace(/[^\d]/g, "");
}

function normalizeNumberText(s: string) {
  const d = onlyDigits(s);
  if (!d) return "";
  return String(parseInt(d, 10));
}

function formatIDR(n: number) {
  try {
    return new Intl.NumberFormat("id-ID").format(n);
  } catch {
    return String(n);
  }
}

function waLink(waNumber: string, message: string) {
  const phone = waNumber.replace(/[^\d]/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${text}`;
}

/* ---------- UI helpers (konsisten login/dashboard) ---------- */

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
        "shadow-[0_20px_60px_-25px_rgba(2,6,23,0.25)]",
        "dark:border-white/10 dark:bg-white/5",
        className
      )}
    >
      {children}
    </div>
  );
}

function SoftBtn({
  as = "button",
  href,
  onClick,
  disabled,
  type,
  className,
  children,
}: {
  as?: "button" | "link";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  children: React.ReactNode;
}) {
  const base = cx(
    "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition",
    "border-slate-200/70 bg-white/60 hover:bg-white/80",
    "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
    "disabled:opacity-60 disabled:pointer-events-none",
    className
  );

  if (as === "link" && href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={base}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({
  onClick,
  disabled,
  type,
  className,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        "text-white disabled:opacity-60",
        "bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
        "shadow-[0_12px_30px_-15px_rgba(99,102,241,0.5)]",
        className
      )}
    >
      {children}
    </button>
  );
}

function DangerBtn({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition",
        "border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15",
        "dark:text-rose-200",
        "disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </div>
      ) : null}
      {children}
    </div>
  );
}

const inputCls = cx(
  "w-full rounded-2xl border bg-white/60 px-4 py-3 text-sm outline-none transition",
  "border-slate-200/70 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/15",
  "dark:bg-white/5 dark:border-white/10 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/15"
);

const selectCls = cx(
  "w-full rounded-2xl border bg-white/60 px-4 py-3 text-sm outline-none transition",
  "border-slate-200/70",
  "dark:bg-white/5 dark:border-white/10"
);

const subtleText = "text-slate-600/80 dark:text-slate-300/70";

/* ----------------------------------------------------------- */

export default function JualanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: productId } = usePromise(params);

  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);

  const [editMode, setEditMode] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [image, setImage] = useState<{ url: string; publicId: string } | null>(
    null
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [oLabel, setOLabel] = useState("");
  const [oUnit, setOUnit] = useState<(typeof UNITS)[number]["value"]>("month");
  const [oQtyText, setOQtyText] = useState("1");
  const [oPriceText, setOPriceText] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);

  const canSaveProduct = useMemo(() => {
    return name.trim().length > 0 && waNumber.trim().length > 0;
  }, [name, waNumber]);

  const canAddOffer = useMemo(() => {
    return (
      oLabel.trim().length > 0 &&
      normalizeNumberText(oQtyText).length > 0 &&
      normalizeNumberText(oPriceText).length > 0
    );
  }, [oLabel, oQtyText, oPriceText]);

  async function loadAll() {
    setLoading(true);

    const { data: p, error: pErr } = await supabase
      .from("products")
      .select(
        "id,name,category,type,description,image_url,image_public_id,wa_number,created_at"
      )
      .eq("id", productId)
      .maybeSingle();

    if (pErr) {
      alert(pErr.message);
      setLoading(false);
      return;
    }

    if (!p) {
      setProduct(null);
      setOffers([]);
      setLoading(false);
      return;
    }

    const prod = p as ProductRow;
    setProduct(prod);

    setName(prod.name ?? "");
    setCategory(prod.category ?? "");
    setType(prod.type ?? "");
    setDescription(prod.description ?? "");
    setWaNumber(prod.wa_number ?? "");
    setImage(
      prod.image_url && prod.image_public_id
        ? { url: prod.image_url, publicId: prod.image_public_id }
        : prod.image_url
        ? { url: prod.image_url, publicId: "" }
        : null
    );

    const { data: o, error: oErr } = await supabase
      .from("product_offers")
      .select("id,product_id,label,unit,qty,price,created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (oErr) {
      alert(oErr.message);
      setOffers([]);
    } else {
      setOffers((o ?? []) as OfferRow[]);
    }

    setLoading(false);
  }

  async function refresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function saveProduct() {
    if (!product) return;
    if (!canSaveProduct) return;

    setSaving(true);

    const payload = {
      name: name.trim(),
      category: category.trim(),
      type: type.trim(),
      description: description.trim() || null,
      wa_number: waNumber.trim(),
      image_url: image?.url ?? null,
      image_public_id: image?.publicId ?? null,
    };

    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEditMode(false);
    await loadAll();
  }

  async function deleteProduct() {
    if (!product) return;

    const ok = window.confirm("Kamu yakin hapus produk ini? (beserta paketnya)");
    if (!ok) return;

    setDeleting(true);

    const { error: oErr } = await supabase
      .from("product_offers")
      .delete()
      .eq("product_id", productId);

    if (oErr) {
      setDeleting(false);
      alert(oErr.message);
      return;
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    setDeleting(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard/jualan");
  }

  async function addOffer(e?: FormEvent) {
    e?.preventDefault();
    if (!canAddOffer) return;

    setOfferBusy(true);

    const qty = parseInt(normalizeNumberText(oQtyText), 10);
    const price = parseInt(normalizeNumberText(oPriceText), 10);

    const payload = {
      product_id: productId,
      label: oLabel.trim(),
      unit: oUnit,
      qty: Number.isFinite(qty) ? qty : 1,
      price: Number.isFinite(price) ? price : 0,
    };

    const { error } = await supabase.from("product_offers").insert(payload);

    setOfferBusy(false);

    if (error) {
      alert(error.message);
      return;
    }

    setOLabel("");
    setOUnit("month");
    setOQtyText("1");
    setOPriceText("");

    await loadAll();
  }

  async function deleteOffer(offerId: string) {
    const ok = window.confirm("Hapus paket ini?");
    if (!ok) return;

    const { error } = await supabase
      .from("product_offers")
      .delete()
      .eq("id", offerId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAll();
  }

  const headerBg = cx(
    "bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.14),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.10),transparent_55%)]",
    "bg-slate-50 text-slate-900",
    "dark:bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.10),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.07),transparent_55%)]",
    "dark:bg-[#0b1020] dark:text-slate-100"
  );

  if (loading) {
    return (
      <GlassCard className={cx("p-6", headerBg)}>
        <div className={cx("text-sm", subtleText)}>Loading…</div>
      </GlassCard>
    );
  }

  if (!product) {
    return (
      <GlassCard className={cx("p-6", headerBg)}>
        <div className="text-lg font-semibold tracking-tight">
          Produk tidak ditemukan
        </div>
        <div className="mt-3">
          <SoftBtn as="link" href="/dashboard/jualan">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </SoftBtn>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top header */}
      <GlassCard className={cx("p-5", headerBg)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SoftBtn as="link" href="/dashboard/jualan" className="px-3">
              <ArrowLeft className="h-4 w-4" />
              Jualan
            </SoftBtn>

            <div>
              <div className="text-lg font-semibold tracking-tight">
                {product.name}
              </div>
              <div className={cx("text-sm", subtleText)}>
                {product.category} • {product.type}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SoftBtn onClick={refresh} disabled={refreshing}>
              <RefreshCw className="h-4 w-4" />
              {refreshing ? "Refresh…" : "Refresh"}
            </SoftBtn>

            {!editMode ? (
              <SoftBtn onClick={() => setEditMode(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </SoftBtn>
            ) : (
              <SoftBtn
                onClick={() => {
                  setName(product.name ?? "");
                  setCategory(product.category ?? "");
                  setType(product.type ?? "");
                  setDescription(product.description ?? "");
                  setWaNumber(product.wa_number ?? "");
                  setImage(
                    product.image_url && product.image_public_id
                      ? {
                          url: product.image_url,
                          publicId: product.image_public_id,
                        }
                      : product.image_url
                      ? { url: product.image_url, publicId: "" }
                      : null
                  );
                  setEditMode(false);
                }}
              >
                <X className="h-4 w-4" />
                Batal
              </SoftBtn>
            )}

            <DangerBtn onClick={deleteProduct} disabled={deleting}>
              <Trash2 className="h-4 w-4" />
              {deleting ? "Menghapus…" : "Hapus"}
            </DangerBtn>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT */}
        <GlassCard className="p-5">
          <div className="mb-3 text-sm font-semibold">
            {editMode ? "Edit Produk" : "Detail Produk"}
          </div>

          {!editMode ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-16 w-16 rounded-2xl border border-white/20 object-cover bg-white/40 dark:border-white/10"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl border border-white/20 bg-white/30 grid place-items-center text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300/70">
                    No Img
                  </div>
                )}

                <div className="flex-1">
                  <div className="text-base font-semibold">{product.name}</div>
                  <div className={cx("text-sm", subtleText)}>
                    {product.category} • {product.type}
                  </div>
                  <div className={cx("text-sm mt-1", subtleText)}>
                    WA: {product.wa_number}
                  </div>
                </div>
              </div>

              {product.description ? (
                <div
                  className={cx(
                    "rounded-2xl border p-4 text-sm whitespace-pre-wrap",
                    "border-white/20 bg-white/40",
                    "dark:border-white/10 dark:bg-white/5",
                    "text-slate-700 dark:text-slate-200"
                  )}
                >
                  {product.description}
                </div>
              ) : (
                <div className={cx("text-sm", subtleText)}>
                  Tidak ada deskripsi.
                </div>
              )}

              <PrimaryBtn
                onClick={() => {
                  const msg = `Halo admin, saya mau order *${product.name}*.\nBoleh tanya stok dulu ya? 🙏`;
                  window.open(waLink(product.wa_number, msg), "_blank");
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Order via WhatsApp
              </PrimaryBtn>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Nama produk">
                <input
                  className={inputCls}
                  placeholder="Nama produk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Category">
                  <input
                    className={inputCls}
                    placeholder="STREAMING / JASA / TOPUP_GAME"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </Field>

                <Field label="Type">
                  <input
                    className={inputCls}
                    placeholder='SHARING / PRIVATE / Famplan'
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Deskripsi">
                <textarea
                  className={cx(inputCls, "min-h-[140px]")}
                  placeholder="Deskripsi (opsional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>

              <Field label="Nomor WhatsApp">
                <input
                  className={inputCls}
                  placeholder="62812xxxxxx"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                />
              </Field>

              <div className="rounded-2xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
                <CoverUpload
                  folder="mycms/products"
                  value={
                    image
                      ? { url: image.url, publicId: image.publicId }
                      : undefined
                  }
                  onChange={(v) => setImage(v ?? null)}
                />
              </div>

              <PrimaryBtn
                onClick={saveProduct}
                disabled={saving || !canSaveProduct}
              >
                <Save className="h-4 w-4" />
                {saving ? "Menyimpan…" : "Simpan Perubahan"}
              </PrimaryBtn>
            </div>
          )}
        </GlassCard>

        {/* RIGHT */}
        <GlassCard className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Paket / Offers</div>
              <div className={cx("text-xs", subtleText)}>
                Tambahkan paket harga (month/robux/uc/page/followers/likes/views, dll).
              </div>
            </div>
          </div>

          <form onSubmit={addOffer} className="space-y-3">
            <Field label="Label">
              <input
                className={inputCls}
                placeholder='Contoh: "Sharing", "Private", "500 Robux"'
                value={oLabel}
                onChange={(e) => setOLabel(e.target.value)}
              />
            </Field>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Unit">
                <select
                  className={selectCls}
                  value={oUnit}
                  onChange={(e) => setOUnit(e.target.value as any)}
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Jumlah (Qty)">
                <input
                  className={inputCls}
                  value={normalizeNumberText(oQtyText)}
                  onChange={(e) => setOQtyText(e.target.value)}
                  inputMode="numeric"
                  placeholder="1"
                />
              </Field>

              <Field label="Harga (Rp)">
                <input
                  className={inputCls}
                  value={normalizeNumberText(oPriceText)}
                  onChange={(e) => setOPriceText(e.target.value)}
                  inputMode="numeric"
                  placeholder="35000"
                />
              </Field>
            </div>

            <PrimaryBtn type="submit" disabled={!canAddOffer || offerBusy}>
              <Plus className="h-4 w-4" />
              {offerBusy ? "Menambah…" : "Tambah Paket"}
            </PrimaryBtn>
          </form>

          <div className="mt-5 space-y-3">
            {offers.length === 0 ? (
              <div className={cx("text-sm", subtleText)}>Belum ada paket.</div>
            ) : (
              offers.map((o) => (
                <div
                  key={o.id}
                  className={cx(
                    "rounded-3xl border p-4 transition",
                    "border-white/20 bg-white/40 hover:bg-white/60",
                    "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{o.label}</div>
                      <div className={cx("text-sm mt-1", subtleText)}>
                        {o.qty} {o.unit} • Rp {formatIDR(o.price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <SoftBtn
                        type="button"
                        onClick={() => {
                          const msg = `Halo admin, saya mau order *${product.name}*.\nPaket: *${o.label}*\n${o.qty} ${o.unit} • Rp ${formatIDR(
                            o.price
                          )}\n\nBoleh tanya stok dulu ya? 🙏`;
                          window.open(waLink(product.wa_number, msg), "_blank");
                        }}
                        className="px-3"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Order WA
                      </SoftBtn>

                      <DangerBtn
                        onClick={() => deleteOffer(o.id)}
                        className="px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </DangerBtn>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Catatan: Qty = durasi (bulan) / jumlah (robux, followers, dll). Harga = rupiah.
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
