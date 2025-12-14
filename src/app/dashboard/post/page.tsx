"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CoverUpload } from "@/components/cloudinary/cover-upload";
import { ArrowRight, Plus, RefreshCw } from "lucide-react";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

type PostRow = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  image_public_id: string | null;
  created_at: string;
};

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

const inputCls = cx(
  "w-full rounded-2xl border bg-white/60 px-4 py-3 text-sm outline-none transition",
  "border-slate-200/70 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/15",
  "dark:bg-white/5 dark:border-white/10 dark:focus:border-sky-400/50 dark:focus:ring-sky-400/15"
);

function SoftButton({
  onClick,
  children,
  className,
  type,
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type ?? "button"}
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

function PrimaryButton({
  onClick,
  children,
  className,
  type,
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
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

/* ------------------------------------------------------------- */

export default function PostPage() {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PostRow[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<{ url: string; publicId: string } | null>(
    null
  );

  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select("id,title,content,image_url,image_public_id,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as PostRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createPost() {
    if (!canSave) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      content: content.trim() || null,
      image_url: image?.url ?? null,
      image_public_id: image?.publicId ?? null,
    };

    const { error } = await supabase.from("posts").insert(payload);

    setSaving(false);
    if (error) return alert(error.message);

    setTitle("");
    setContent("");
    setImage(null);

    await load();
  }

  return (
    <main
      className={cx(
        "min-h-screen",
        "bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.16),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.10),transparent_55%)]",
        "bg-slate-50 text-slate-900",
        "dark:bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(1000px_circle_at_80%_20%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(900px_circle_at_70%_80%,rgba(16,185,129,0.08),transparent_55%)]",
        "dark:bg-[#0b1020] dark:text-slate-100"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <GlassCard className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold tracking-tight">Post</div>
              <div className={cx("text-sm", subtleText)}>
                Tulis info / update terbaru. Bisa pakai gambar.
              </div>
            </div>

            <SoftButton onClick={load}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </SoftButton>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-12">
            {/* Create */}
            <div className="lg:col-span-5">
              <GlassCard className="p-4">
                <div className="text-sm font-semibold tracking-tight">
                  Tambah Post
                </div>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Judul
                    </label>
                    <input
                      className={inputCls}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Judul post..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Isi (opsional)
                    </label>
                    <textarea
                      className={cx(inputCls, "min-h-[140px]")}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tulis update..."
                    />
                  </div>

                  <div className="rounded-2xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
                    <CoverUpload
                      folder="mycms/posts"
                      value={
                        image
                          ? { url: image.url, publicId: image.publicId }
                          : undefined
                      }
                      onChange={(v) => setImage(v ?? null)}
                    />
                  </div>

                  <PrimaryButton
                    onClick={createPost}
                    disabled={!canSave || saving}
                  >
                    <Plus className="h-4 w-4" />
                    {saving ? "Menyimpan..." : "Publish"}
                  </PrimaryButton>
                </div>
              </GlassCard>
            </div>

            {/* List */}
            <div className="lg:col-span-7">
              <div className="text-sm font-semibold tracking-tight">
                Daftar Post
              </div>

              {loading ? (
                <GlassCard className="mt-3 p-4">
                  <div className={cx("text-sm", subtleText)}>Loading...</div>
                </GlassCard>
              ) : items.length === 0 ? (
                <GlassCard className="mt-3 p-4">
                  <div className={cx("text-sm", subtleText)}>
                    Belum ada post.
                  </div>
                </GlassCard>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/post/${p.id}`}
                      className={cx(
                        "group rounded-3xl border p-4 backdrop-blur-xl transition",
                        "border-white/20 bg-white/40 hover:bg-white/60",
                        "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="line-clamp-1 text-sm font-semibold">
                            {p.title}
                          </div>
                          <div className={cx("mt-1 text-xs", subtleText)}>
                            {timeAgo(p.created_at)}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-70" />
                      </div>

                      {p.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="mt-3 h-28 w-full rounded-2xl border border-white/20 object-cover dark:border-white/10"
                        />
                      )}

                      {p.content && (
                        <p className="mt-3 line-clamp-2 text-sm text-slate-700/75 dark:text-slate-300/70">
                          {p.content}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
