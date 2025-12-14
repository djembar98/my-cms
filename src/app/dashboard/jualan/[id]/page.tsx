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

/* ===================== TYPES ===================== */

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

  // ✅ badge fields
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

/* ===================== HELPERS ===================== */

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

/* ===================== UI ===================== */

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
  onClick,
  children,
  className,
  disabled,
  type,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
        "border-slate-200/70 bg-white/60 hover:bg-white/80",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
        "disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({
  onClick,
  children,
  className,
  disabled,
  type,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        "text-white disabled:opacity-60",
        "bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))]",
        "shadow-[0_12px_30px_-15px_rgba(99,102,241,0.55)]",
        className
      )}
    >
      {children}
    </button>
  );
}

const inputCls = cx(
  "w-full rounded-2xl border bg-white/60 px-4 py-3 text-sm outline-none transition",
  "border-slate-200/70 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/15",
  "dark:bg-white/5 dark:border-white/10 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/15"
);

const selectCls = cx(
  "w-full rounded-2xl border bg-white/60 px-4 py-3 text-sm outline-none",
  "border-slate-200/70 dark:bg-white/5 dark:border-white/10"
);

/* ===================== PAGE ===================== */

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

  /* product fields */
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [image, setImage] = useState<{ url: string; publicId: string } | null>(
    null
  );

  /* badge states */
  const [garansi, setGaransi] = useState(false);
  const [supportDevice, setSupportDevice] = useState(false);
  const [promo, setPromo] = useState(false);
  const [promoText, setPromoText] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* offer form */
  const [oLabel, setOLabel] = useState("");
  const [oUnit, setOUnit] =
    useState<(typeof UNITS)[number]["value"]>("month");
  const [oQtyText, setOQtyText] = useState("1");
  const [oPriceText, setOPriceText] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);

  const canSaveProduct = useMemo(
    () => name.trim().length > 0 && waNumber.trim().length > 0,
    [name, waNumber]
  );

  async function loadAll() {
    setLoading(true);

    const { data: p, error } = await supabase
      .from("products")
      .select(
        "id,name,category,type,description,image_url,image_public_id,wa_number,created_at,promo,promo_text,garansi,support_device"
      )
      .eq("id", productId)
      .maybeSingle();

    if (error || !p) {
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
      prod.image_url
        ? { url: prod.image_url, publicId: prod.image_public_id ?? "" }
        : null
    );

    setGaransi(!!prod.garansi);
    setSupportDevice(!!prod.support_device);
    setPromo(!!prod.promo);
    setPromoText(prod.promo_text ?? "");

    const { data: o } = await supabase
      .from("product_offers")
      .select("id,product_id,label,unit,qty,price,created_at")
      .eq("product_id", productId)
      .order("created_at");

    setOffers((o ?? []) as OfferRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function saveProduct() {
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

      garansi,
      support_device: supportDevice,
      promo,
      promo_text: promo ? promoText.trim() || null : null,
    };

    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId);

    setSaving(false);
    if (!error) {
      setEditMode(false);
      loadAll();
    }
  }

  async function deleteProduct() {
    if (!confirm("Hapus produk beserta paketnya?")) return;
    setDeleting(true);

    await supabase.from("product_offers").delete().eq("product_id", productId);
    await supabase.from("products").delete().eq("id", productId);

    setDeleting(false);
    router.push("/dashboard/jualan");
  }

  async function addOffer(e?: FormEvent) {
    e?.preventDefault();
    setOfferBusy(true);

    await supabase.from("product_offers").insert({
      product_id: productId,
      label: oLabel.trim(),
      unit: oUnit,
      qty: parseInt(oQtyText, 10),
      price: parseInt(oPriceText, 10),
    });

    setOLabel("");
    setOQtyText("1");
    setOPriceText("");
    setOfferBusy(false);
    loadAll();
  }

  async function deleteOffer(id: string) {
    if (!confirm("Hapus paket ini?")) return;
    await supabase.from("product_offers").delete().eq("id", id);
    loadAll();
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className={cx("text-sm", subtleText)}>Loading…</div>
      </GlassCard>
    );
  }

  if (!product) {
    return (
      <GlassCard className="p-6">
        <div className="font-semibold">Produk tidak ditemukan</div>
        <Link href="/dashboard/jualan" className="mt-3 inline-block underline">
          Kembali
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <GlassCard className="p-5">
        <div className="flex justify-between items-center">
          <Link
            href="/dashboard/jualan"
            className="inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Jualan
          </Link>

          <div className="flex gap-2">
            {!editMode ? (
              <SoftBtn onClick={() => setEditMode(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </SoftBtn>
            ) : (
              <SoftBtn onClick={() => setEditMode(false)}>
                <X className="h-4 w-4" /> Batal
              </SoftBtn>
            )}

            <SoftBtn onClick={loadAll} disabled={refreshing}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </SoftBtn>

            <SoftBtn onClick={deleteProduct} disabled={deleting}>
              <Trash2 className="h-4 w-4" /> Hapus
            </SoftBtn>
          </div>
        </div>
      </GlassCard>

      {/* CONTENT */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT */}
        <GlassCard className="p-5 space-y-4">
          <input
            className={inputCls}
            disabled={!editMode}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama produk"
          />

          <input
            className={inputCls}
            disabled={!editMode}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
          />

          <input
            className={inputCls}
            disabled={!editMode}
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Type"
          />

          <textarea
            className={cx(inputCls, "min-h-[120px]")}
            disabled={!editMode}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className={inputCls}
            disabled={!editMode}
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="Nomor WhatsApp"
          />

          {/* BADGE */}
          {editMode && (
            <div className="space-y-2">
              <label className="flex justify-between">
                <span>Garansi</span>
                <input
                  type="checkbox"
                  checked={garansi}
                  onChange={(e) => setGaransi(e.target.checked)}
                />
              </label>

              <label className="flex justify-between">
                <span>Support device</span>
                <input
                  type="checkbox"
                  checked={supportDevice}
                  onChange={(e) => setSupportDevice(e.target.checked)}
                />
              </label>

              <label className="flex justify-between">
                <span>Promo</span>
                <input
                  type="checkbox"
                  checked={promo}
                  onChange={(e) => setPromo(e.target.checked)}
                />
              </label>

              {promo && (
                <input
                  className={inputCls}
                  placeholder="Teks promo (opsional)"
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                />
              )}
            </div>
          )}

          {editMode && (
            <CoverUpload
              folder="mycms/products"
              value={image ?? undefined}
              onChange={(v) => setImage(v)}
            />
          )}

          {editMode && (
            <PrimaryBtn onClick={saveProduct} disabled={saving}>
              <Save className="h-4 w-4" /> Simpan
            </PrimaryBtn>
          )}
        </GlassCard>

        {/* RIGHT – OFFERS */}
        <GlassCard className="p-5 space-y-4">
          <form onSubmit={addOffer} className="space-y-3">
            <input
              className={inputCls}
              placeholder="Label paket"
              value={oLabel}
              onChange={(e) => setOLabel(e.target.value)}
            />

            <div className="grid grid-cols-3 gap-2">
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

              <input
                className={inputCls}
                value={oQtyText}
                onChange={(e) => setOQtyText(normalizeNumberText(e.target.value))}
              />

              <input
                className={inputCls}
                value={oPriceText}
                onChange={(e) =>
                  setOPriceText(normalizeNumberText(e.target.value))
                }
              />
            </div>

            <PrimaryBtn type="submit" disabled={offerBusy}>
              <Plus className="h-4 w-4" /> Tambah Paket
            </PrimaryBtn>
          </form>

          <div className="space-y-2">
            {offers.map((o) => (
              <div
                key={o.id}
                className="flex justify-between rounded-2xl border p-3"
              >
                <div>
                  <div className="font-medium">{o.label}</div>
                  <div className="text-sm text-slate-500">
                    {o.qty} {o.unit} • Rp {formatIDR(o.price)}
                  </div>
                </div>
                <SoftBtn onClick={() => deleteOffer(o.id)}>
                  <Trash2 className="h-4 w-4" />
                </SoftBtn>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
