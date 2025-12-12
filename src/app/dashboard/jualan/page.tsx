"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const CATEGORIES = [
  { value: "STREAMING", label: "Streaming" },
  { value: "EDITING", label: "Editing" },
  { value: "EDUCATIONAL", label: "Educational" },
  { value: "TOPUP_GAME", label: "Topup Game" },
  { value: "SOCIAL_NEEDS", label: "Social Needs" },
  { value: "JASA", label: "Jasa" },
  { value: "OTHERS", label: "Others" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

const TYPE_PRESETS = [
  "SHARING",
  "SEMI-PRIVATE",
  "PRIVATE",
  "BILL",
  "INVITE",
] as const;
type TypePreset = (typeof TYPE_PRESETS)[number];

function isTypePreset(v: string): v is TypePreset {
  return (TYPE_PRESETS as readonly string[]).includes(v);
}

export default function JualanPage() {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProductRow[]>([]);

  // form
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryValue>(CATEGORIES[0].value);
  const [type, setType] = useState<string>("SHARING");
  const [description, setDescription] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [image, setImage] = useState<{ url: string; publicId: string } | null>(
    null
  );

  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    return name.trim().length > 0 && waNumber.trim().length > 0;
  }, [name, waNumber]);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,category,type,description,image_url,image_public_id,wa_number,created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as ProductRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createProduct() {
    if (!canSave) return;

    setSaving(true);

    const payload = {
      name: name.trim(),
      category,
      type: type.trim() || "SHARING",
      description: description.trim() || null,
      wa_number: waNumber.trim(),
      image_url: image?.url ?? null,
      image_public_id: image?.publicId ?? null,
    };

    const { error } = await supabase.from("products").insert(payload);

    setSaving(false);
    if (error) return alert(error.message);

    // reset
    setName("");
    setCategory(CATEGORIES[0].value);
    setType("SHARING");
    setDescription("");
    setWaNumber("");
    setImage(null);

    load();
  }

  const typeSelectValue = (() => {
    const up = type.toUpperCase();
    return isTypePreset(up) ? up : "CUSTOM";
  })();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
        <div className="text-lg font-semibold">Jualan</div>
        <div className="text-sm text-black/60 dark:text-white/60">
          Tambah produk (Netflix/Spotify/Canva/Robux/UC PUBG/Jasa/Sosmed/dll).
          Paket harga dikelola di detail produk.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create */}
        <div className="rounded-2xl border bg-white p-5 space-y-4 dark:bg-neutral-950">
          <div className="font-semibold">Tambah Produk</div>

          <input
            className="w-full rounded-xl border p-3 bg-transparent"
            placeholder="Nama produk (contoh: Netflix, Canva Pro, Robux, Joki Tugas)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="w-full rounded-xl border p-3 bg-white text-black dark:bg-neutral-950 dark:text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryValue)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <div className="space-y-2">
              <select
                className="w-full rounded-xl border p-3 bg-white text-black dark:bg-neutral-950 dark:text-white"
                value={typeSelectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "CUSTOM") return;
                  setType(v);
                }}
              >
                <option value="SHARING">SHARING</option>
                <option value="SEMI-PRIVATE">SEMI-PRIVATE</option>
                <option value="PRIVATE">PRIVATE</option>
                <option value="BILL">BILL</option>
                <option value="INVITE">INVITE</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>

              <input
                className="w-full rounded-xl border p-3 bg-transparent"
                placeholder='Type custom (contoh: "Famplan", "Indplan", "Mixplan")'
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>
          </div>

          <textarea
            className="w-full rounded-xl border p-3 min-h-[120px] bg-transparent"
            placeholder="Deskripsi (opsional). Bisa paste aturan/benefit/harga ringkas."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="w-full rounded-xl border p-3 bg-transparent"
            placeholder="Nomor WhatsApp (contoh: 62812xxxxxx)"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
          />

          <CoverUpload
            folder="mycms/products"
            value={
              image ? { url: image.url, publicId: image.publicId } : undefined
            }
            onChange={(v) => setImage(v)}
          />

          <button
            onClick={createProduct}
            disabled={saving || !canSave}
            className="w-full rounded-xl bg-black p-3 text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {saving ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </div>

        {/* List */}
        <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Daftar Produk</div>
            <button
              onClick={load}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-black/60 dark:text-white/60">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-black/60 dark:text-white/60">
              Belum ada produk.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/jualan/${p.id}`}
                  className="block rounded-2xl border p-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        {p.category} • {p.type}
                      </div>
                      <div className="text-xs text-black/60 dark:text-white/60 mt-1">
                        WA: {p.wa_number}
                      </div>
                    </div>

                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-12 w-12 rounded-xl border object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl border flex items-center justify-center text-[10px] text-black/50 dark:text-white/50">
                        No Img
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
