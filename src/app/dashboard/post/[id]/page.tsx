"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, use as usePromise } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CoverUpload } from "@/components/cloudinary/cover-upload";
import { ArrowLeft, Pencil, Save, Trash2, RefreshCw, X } from "lucide-react";

type PostRow = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  image_public_id: string | null;
  created_at: string;
};

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
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
        "shadow-[0_20px_60px_-25px_rgba(2,6,23,0.25)]",
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

function SoftBtn({
  as = "button",
  href,
  onClick,
  disabled,
  className,
  children,
  type,
}: {
  as?: "button" | "link";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
}) {
  const base = cx(
    "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition",
    "border-slate-200/70 bg-white/60 hover:bg-white/80",
    "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
    "disabled:opacity-60 disabled:pointer-events-none",
    className
  );

  if (as === "link" && href) return <Link href={href} className={base}>{children}</Link>;

  return (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
  );
}

function PrimaryBtn({
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

/* ------------------------------------------------------------- */

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: postId } = usePromise(params);

  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [post, setPost] = useState<PostRow | null>(null);

  const [editMode, setEditMode] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<{ url: string; publicId: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select("id,title,content,image_url,image_public_id,created_at")
      .eq("id", postId)
      .maybeSingle();

    if (error) {
      alert(error.message);
      setPost(null);
      setLoading(false);
      return;
    }

    if (!data) {
      setPost(null);
      setLoading(false);
      return;
    }

    const p = data as PostRow;
    setPost(p);

    setTitle(p.title ?? "");
    setContent(p.content ?? "");
    setImage(
      p.image_url && p.image_public_id
        ? { url: p.image_url, publicId: p.image_public_id }
        : p.image_url
        ? { url: p.image_url, publicId: "" }
        : null
    );

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function save() {
    if (!post) return;
    if (!canSave) return;

    setSaving(true);

    const payload = {
      title: title.trim(),
      content: content.trim() || null,
      image_url: image?.url ?? null,
      image_public_id: image?.publicId ?? null,
    };

    const { error } = await supabase.from("posts").update(payload).eq("id", postId);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEditMode(false);
    await load();
  }

  async function remove() {
    if (!post) return;
    const ok = window.confirm("Kamu yakin hapus postingan ini?");
    if (!ok) return;

    setDeleting(true);

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    setDeleting(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard/post");
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

  if (!post) {
    return (
      <GlassCard className={cx("p-6", headerBg)}>
        <div className="text-lg font-semibold tracking-tight">Post tidak ditemukan</div>
        <div className="mt-3">
          <SoftBtn as="link" href="/dashboard/post">
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
            <SoftBtn as="link" href="/dashboard/post" className="px-3">
              <ArrowLeft className="h-4 w-4" />
              Post
            </SoftBtn>

            <div>
              <div className="text-lg font-semibold tracking-tight">{post.title}</div>
              <div className={cx("text-sm", subtleText)}>Detail postingan</div>
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
                  setTitle(post.title ?? "");
                  setContent(post.content ?? "");
                  setImage(
                    post.image_url && post.image_public_id
                      ? { url: post.image_url, publicId: post.image_public_id }
                      : post.image_url
                      ? { url: post.image_url, publicId: "" }
                      : null
                  );
                  setEditMode(false);
                }}
              >
                <X className="h-4 w-4" />
                Batal
              </SoftBtn>
            )}

            <DangerBtn onClick={remove} disabled={deleting}>
              <Trash2 className="h-4 w-4" />
              {deleting ? "Menghapus…" : "Hapus"}
            </DangerBtn>
          </div>
        </div>
      </GlassCard>

      {/* Content */}
      <GlassCard className="p-5">
        {!editMode ? (
          <div className="space-y-4">
            {post.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full max-h-[360px] rounded-3xl border border-white/20 object-cover bg-white/40 dark:border-white/10"
              />
            ) : (
              <div className="w-full h-[180px] rounded-3xl border border-white/20 bg-white/30 grid place-items-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300/70">
                Tidak ada gambar
              </div>
            )}

            {post.content ? (
              <div className="rounded-2xl border border-white/20 bg-white/40 p-4 text-sm text-slate-700 whitespace-pre-wrap dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                {post.content}
              </div>
            ) : (
              <div className={cx("text-sm", subtleText)}>Tidak ada konten.</div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <input
              className={inputCls}
              placeholder="Judul"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className={cx(inputCls, "min-h-[220px]")}
              placeholder="Isi / konten post"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className="rounded-2xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
              <CoverUpload
                folder="mycms/posts"
                value={image ? { url: image.url, publicId: image.publicId } : undefined}
                onChange={(v) => setImage(v ?? null)}
              />
            </div>

            <PrimaryBtn onClick={save} disabled={saving || !canSave}>
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan…" : "Simpan"}
            </PrimaryBtn>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
