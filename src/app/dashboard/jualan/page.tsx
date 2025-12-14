"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CoverUpload } from "@/components/cloudinary/cover-upload";
import { RefreshCw, Plus } from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
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

type CategoryKey = (typeof CATEGORIES)[number]["value"];

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

const subtleText = "text-slate-600/80 dark:text-slate-300/70";

const inputCls = cx(
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
  "bg-white/60 text-slate-900 placeholder:text-slate-500/70",
  "border-slate-200/70 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/15",
  "dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-300/40",
  "dark:border-white/10 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/15"
);

const selectCls = cx(
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
  "bg-white/60 text-slate-900",
  "border-slate-200/70 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/15",
  "dark:bg-[#0b1020]/40 dark:text-slate-100",
  "dark:border-white/10 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/15",
  "dark:[color-scheme:dark]"
);

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
  disabled,
  className,
  children,
  type,
}: {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
        "border-slate-200/70 bg-white/60 hover:bg-white/80 text-slate-800",
        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-100",
        "disabled:opacity-60 disabled:pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  className,
  children,
  type,
}: {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
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
        "bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))] hover:brightness-[1.03]",
        "shadow-[0_12px_30px_-15px_rgba(99,102,241,0.55)]",
        className
      )}
    >
      {children}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-2xl border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md",
        "border-slate-200/70 bg-white/60 text-slate-700",
        "dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
      )}
    >
      {children}
    </span>
  );
}

export default function JualanPage() {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProductRow[]>([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryKey>("STREAMING");
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
      .select("id,name,type,description,image_url,image_public_id,wa_number,created_at")
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
      type: category, 
      description: description.trim() || null,
      wa_number: waNumber.trim(),
      image_url: image?.url ?? null,
      image_public_id: image?.publicId ?? null,
    };

    const { error } = await supabase.from("products").insert(payload);

    setSaving(false);
    if (error) return alert(error.message);

    setName("");
    setCategory("STREAMING");
    setDescription("");
    setWaNumber("");
    setImage(null);

    load();
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="text-lg font-semibold tracking-tight">Jualan</div>
        <div className={cx("mt-1 text-sm", subtleText)}>
          Tambah produk (Netflix/Spotify/Canva/Robux/UC PUBG/Jasa/Sosmed/dll).
          Paket harga dikelola di detail produk.
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold tracking-tight">Tambah Produk</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Wajib: nama + WA
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <input
              className={inputCls}
              placeholder="Nama produk (contoh: Netflix, Canva Pro, Robux, Joki Tugas)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Category
              </div>

              <select
                className={selectCls}
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <div className="text-[11px] text-slate-500/80 dark:text-slate-300/50">
                Kalau dropdown masih “keputihan” di browser tertentu, ini keterbatasan native
                select. (Tapi dengan <code>color-scheme</code> biasanya sudah fix.)
              </div>
            </div>

            <textarea
              className={cx(inputCls, "min-h-[120px]")}
              placeholder="Deskripsi (opsional). Bisa paste benefit/aturan ringkas."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              className={inputCls}
              placeholder="Nomor WhatsApp (contoh: 62812xxxxxx)"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
            />

            <div className="rounded-2xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
              <CoverUpload
                folder="mycms/products"
                value={image ? { url: image.url, publicId: image.publicId } : undefined}
                onChange={(v) => setImage(v ?? null)}
              />
            </div>

            <PrimaryButton onClick={createProduct} disabled={saving || !canSave}>
              <Plus className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Produk"}
            </PrimaryButton>
          </div>
        </GlassCard>

        {/* List */}
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold tracking-tight">Daftar Produk</div>
              <div className={cx("text-sm", subtleText)}>
                Klik card untuk kelola paket harga
              </div>
            </div>

            <SoftButton onClick={load}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </SoftButton>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className={cx("text-sm", subtleText)}>Loading...</div>
            ) : items.length === 0 ? (
              <div className={cx("text-sm", subtleText)}>Belum ada produk.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/jualan/${p.id}`}
                    className={cx(
                      "group rounded-3xl border p-4 transition",
                      "border-white/20 bg-white/40 hover:bg-white/60",
                      "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Pill>{p.type}</Pill>
                          <Pill>WA: {p.wa_number}</Pill>
                        </div>
                      </div>

                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-12 w-12 rounded-2xl border border-white/20 object-cover bg-white/40 dark:border-white/10"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl border border-white/20 bg-white/30 dark:border-white/10 dark:bg-white/5" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
