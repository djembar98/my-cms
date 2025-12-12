"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CoverUpload } from "@/components/cloudinary/cover-upload";

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

function normalizeNumberInput(v: string) {
  const only = v.replace(/[^\d]/g, "");
  if (only === "") return "";
  return only.replace(/^0+(?=\d)/, "");
}

export default function JualanDetailPage() {
  const supabase = createSupabaseBrowserClient();
  const params = useParams();
  const router = useRouter();

  const productId = String((params as { id?: string }).id ?? "");

  const [loading, setLoading] = useState(true);

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");

  // mode
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // editable fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [image, setImage] = useState<{ url: string; publicId: string } | null>(
    null
  );

  // offer create
  const [offerLabel, setOfferLabel] = useState("");
  const [offerUnit, setOfferUnit] = useState("month");
  const [offerQty, setOfferQty] = useState<string>("1");
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [addingOffer, setAddingOffer] = useState(false);

  const canSave = useMemo(() => {
    return name.trim().length > 0 && waNumber.trim().length > 0;
  }, [name, waNumber]);

  async function load() {
    setLoading(true);

    const { data: p, error: pErr } = await supabase
      .from("products")
      .select(
        "id,name,category,type,description,image_url,image_public_id,wa_number,created_at"
      )
      .eq("id", productId)
      .single();

    if (pErr) {
      alert(pErr.message);
      setLoading(false);
      return;
    }

    const prod = p as ProductRow;
    setProduct(prod);

    setName(prod.name);
    setCategory(prod.category);
    setType(prod.type);
    setDescription(prod.description ?? "");
    setWaNumber(prod.wa_number);
    setImage(
      prod.image_url
        ? { url: prod.image_url, publicId: prod.image_public_id ?? "" }
        : null
    );

    const { data: o, error: oErr } = await supabase
      .from("product_offers")
      .select("id,product_id,label,unit,qty,price,created_at")
      .eq("product_id", prod.id)
      .order("created_at", { ascending: true });

    if (oErr) {
      alert(oErr.message);
      setOffers([]);
      setSelectedOfferId("");
    } else {
      const list = (o ?? []) as OfferRow[];
      setOffers(list);
      setSelectedOfferId(list[0]?.id ?? "");
    }

    setIsEdit(false);
    setLoading(false);
  }

  useEffect(() => {
    if (!productId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function cancelEdit() {
    if (!product) return;
    setName(product.name);
    setCategory(product.category);
    setType(product.type);
    setDescription(product.description ?? "");
    setWaNumber(product.wa_number);
    setImage(
      product.image_url
        ? { url: product.image_url, publicId: product.image_public_id ?? "" }
        : null
    );
    setIsEdit(false);
  }

  async function saveProduct() {
    if (!product) return;
    if (!canSave) return;

    setSaving(true);

    const { error } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        category: category.trim() || "STREAMING",
        type: type.trim() || "SHARING",
        description: description.trim() || null,
        wa_number: waNumber.trim(),
        image_url: image?.url ?? null,
        image_public_id: image?.publicId ?? null,
      })
      .eq("id", product.id);

    setSaving(false);
    if (error) return alert(error.message);

    load();
  }

  async function deleteProduct() {
    const ok = confirm("Kamu yakin hapus produk ini?");
    if (!ok) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (error) return alert(error.message);

    router.push("/dashboard/jualan");
  }

  async function addOffer() {
    if (!product) return;

    const label = offerLabel.trim();
    if (!label) return alert("Label paket wajib");

    const qtyNum = Number(offerQty || "0");
    const priceNum = Number(offerPrice || "0");

    if (!Number.isFinite(qtyNum) || qtyNum <= 0) return alert("Qty harus > 0");
    if (!Number.isFinite(priceNum) || priceNum < 0)
      return alert("Harga harus >= 0");

    setAddingOffer(true);

    const { error } = await supabase.from("product_offers").insert({
      product_id: product.id,
      label,
      unit: offerUnit,
      qty: qtyNum,
      price: priceNum,
    });

    setAddingOffer(false);
    if (error) return alert(error.message);

    setOfferLabel("");
    setOfferUnit("month");
    setOfferQty("1");
    setOfferPrice("");

    load();
  }

  async function deleteOffer(offerId: string) {
    const ok = confirm("Kamu yakin hapus paket ini?");
    if (!ok) return;

    const { error } = await supabase
      .from("product_offers")
      .delete()
      .eq("id", offerId);
    if (error) return alert(error.message);

    load();
  }

  async function trackClick(offerId: string) {
    // best effort
    await supabase.from("order_clicks").insert({
      product_id: productId,
      offer_id: offerId,
    });
  }

  function orderWA() {
    if (!product) return;
    const chosen = offers.find((x) => x.id === selectedOfferId);
    if (!chosen) return alert("Pilih paket dulu");

    const msg = [
      "Halo admin, mau order ya 😊",
      "",
      `Produk: ${product.name}`,
      `Kategori: ${product.category}`,
      `Tipe: ${product.type}`,
      `Paket: ${chosen.label}`,
      `Durasi: ${unitLabel(chosen.unit, chosen.qty)}`,
      `Harga: ${formatRupiah(chosen.price)}`,
      "",
      "Jangan lupa tanyakan stock dulu, yaa!♡♡",
    ].join("\n");

    trackClick(chosen.id).catch(() => {});
    window.open(buildWaLink(product.wa_number, msg), "_blank");
  }

  if (loading || !product) {
    return (
      <div className="text-sm text-black/60 dark:text-white/60">Loading...</div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/dashboard/jualan")}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          ← Kembali
        </button>

        {!isEdit ? (
          <div className="flex items-center gap-2">
            <button
              onClick={deleteProduct}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Delete
            </button>
            <button
              onClick={() => setIsEdit(true)}
              className="rounded-lg bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEdit}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Batal
            </button>
            <button
              onClick={saveProduct}
              disabled={saving || !canSave}
              className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        )}
      </div>

      {/* Product card */}
      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950 space-y-4">
        <div>
          <div className="text-lg font-semibold">
            {isEdit ? "Edit Produk" : "Detail Produk"}
          </div>
          <div className="text-sm text-black/60 dark:text-white/60">
            {product.category} • {product.type}
          </div>
        </div>

        {/* Image */}
        {isEdit ? (
          <CoverUpload
            folder="mycms/products"
            value={
              image ? { url: image.url, publicId: image.publicId } : undefined
            }
            onChange={(v) => setImage(v)}
          />
        ) : product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full max-w-2xl rounded-2xl border object-cover"
          />
        ) : (
          <div className="w-full max-w-2xl rounded-2xl border p-6 text-sm text-black/60 dark:text-white/60">
            Tidak ada image
          </div>
        )}

        {/* Fields */}
        {isEdit ? (
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="w-full rounded-xl border p-3 bg-transparent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama"
            />
            <input
              className="w-full rounded-xl border p-3 bg-transparent"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (STREAMING/EDITING/...)"
            />
            <input
              className="w-full rounded-xl border p-3 bg-transparent"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Type (contoh: SHARING / PRIVATE / Famplan / Indplan)"
            />
            <input
              className="w-full rounded-xl border p-3 bg-transparent"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="Nomor WA (628...)"
            />
            <textarea
              className="md:col-span-2 w-full rounded-xl border p-3 min-h-[120px] bg-transparent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-2xl border p-4">
              <div className="font-semibold">{product.name}</div>
              <div className="text-sm text-black/60 dark:text-white/60 whitespace-pre-wrap">
                {product.description?.trim()
                  ? product.description
                  : "Tidak ada deskripsi"}
              </div>
            </div>
            <div className="text-sm text-black/60 dark:text-white/60">
              WA: {product.wa_number}
            </div>
          </div>
        )}
      </div>

      {/* Offers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add offer */}
        <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950 space-y-3">
          <div className="font-semibold">Tambah Paket</div>

          <input
            className="w-full rounded-xl border p-3 bg-transparent"
            placeholder='Label (contoh: "Sharing 1P1U", "Semi-Private", "Private", "Famplan")'
            value={offerLabel}
            onChange={(e) => setOfferLabel(e.target.value)}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="w-full rounded-xl border p-3 bg-white text-black dark:bg-neutral-950 dark:text-white"
              value={offerUnit}
              onChange={(e) => setOfferUnit(e.target.value)}
            >
              <option value="month">month</option>
              <option value="year">year</option>
              <option value="day">day</option>
              <option value="pcs">pcs</option>
            </select>

            <input
              className="w-full rounded-xl border p-3 bg-transparent"
              inputMode="numeric"
              placeholder="Qty (contoh: 1, 3, 12)"
              value={offerQty}
              onChange={(e) =>
                setOfferQty(normalizeNumberInput(e.target.value))
              }
            />

            <input
              className="w-full rounded-xl border p-3 bg-transparent"
              inputMode="numeric"
              placeholder="Harga (contoh: 35000)"
              value={offerPrice}
              onChange={(e) =>
                setOfferPrice(normalizeNumberInput(e.target.value))
              }
            />
          </div>

          <button
            onClick={addOffer}
            disabled={addingOffer || !offerLabel.trim()}
            className="w-full rounded-xl bg-black p-3 text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {addingOffer ? "Menambah..." : "Tambah Paket"}
          </button>
        </div>

        {/* Offers list + order */}
        <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold">Daftar Paket</div>
            <button
              onClick={orderWA}
              disabled={!offers.length || !selectedOfferId}
              className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
            >
              Order WA
            </button>
          </div>

          {!offers.length ? (
            <div className="text-sm text-black/60 dark:text-white/60">
              Belum ada paket. Tambahkan dulu.
            </div>
          ) : (
            <>
              <select
                className="w-full rounded-xl border p-3 bg-white text-black dark:bg-neutral-950 dark:text-white"
                value={selectedOfferId}
                onChange={(e) => setSelectedOfferId(e.target.value)}
              >
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label} • {unitLabel(o.unit, o.qty)} •{" "}
                    {formatRupiah(o.price)}
                  </option>
                ))}
              </select>

              <div className="space-y-2">
                {offers.map((o) => (
                  <div key={o.id} className="rounded-xl border p-3">
                    <div className="font-medium">{o.label}</div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      {unitLabel(o.unit, o.qty)} • {formatRupiah(o.price)}
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={() => deleteOffer(o.id)}
                        className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
