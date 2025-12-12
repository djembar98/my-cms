"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CoverUpload } from "@/components/cloudinary/cover-upload";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  published: boolean;
  cover_url: string | null;
  cover_public_id: string | null;
  created_at: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PostDetailPage() {
  const supabase = createSupabaseBrowserClient();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = params.id;

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostRow | null>(null);

  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // edit fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [cover, setCover] = useState<{ url: string; publicId: string } | null>(
    null
  );

  const canSave = useMemo(() => title.trim() && slug.trim(), [title, slug]);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id,title,slug,content,published,cover_url,cover_public_id,created_at"
      )
      .eq("id", postId)
      .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const p = data as PostRow;
    setPost(p);

    setTitle(p.title);
    setSlug(p.slug);
    setContent(p.content ?? "");
    setPublished(p.published);
    setCover(
      p.cover_url
        ? { url: p.cover_url, publicId: p.cover_public_id ?? "" }
        : null
    );

    setIsEdit(false);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  function cancelEdit() {
    if (!post) return;
    setTitle(post.title);
    setSlug(post.slug);
    setContent(post.content ?? "");
    setPublished(post.published);
    setCover(
      post.cover_url
        ? { url: post.cover_url, publicId: post.cover_public_id ?? "" }
        : null
    );
    setIsEdit(false);
  }

  async function savePost() {
    if (!post) return;
    if (!canSave) return;

    setSaving(true);

    const { error } = await supabase
      .from("posts")
      .update({
        title: title.trim(),
        slug: slugify(slug),
        content: content.trim() || null,
        published,
        cover_url: cover?.url ?? null,
        cover_public_id: cover?.publicId ?? null,
      })
      .eq("id", post.id);

    setSaving(false);
    if (error) return alert(error.message);

    load();
  }

  async function deletePost() {
    const ok = confirm("Kamu yakin hapus postingan ini?");
    if (!ok) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) return alert(error.message);

    router.push("/dashboard/post");
  }

  if (loading || !post) {
    return (
      <div className="text-sm text-black/60 dark:text-white/60">Loading...</div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/dashboard/post")}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          ← Kembali
        </button>

        {!isEdit ? (
          <div className="flex items-center gap-2">
            <button
              onClick={deletePost}
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
              onClick={savePost}
              disabled={saving || !canSave}
              className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950 space-y-4">
        <div>
          <div className="text-lg font-semibold">
            {isEdit ? "Edit Post" : "Detail Post"}
          </div>
          <div className="text-sm text-black/60 dark:text-white/60">
            /{post.slug} • {post.published ? "Published" : "Draft"}
          </div>
        </div>

        {/* Cover */}
        {isEdit ? (
          <CoverUpload
            folder="mycms/posts"
            value={
              cover ? { url: cover.url, publicId: cover.publicId } : undefined
            }
            onChange={(v) => setCover(v)}
          />
        ) : post.cover_url ? (
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full max-w-2xl rounded-2xl border object-cover"
          />
        ) : (
          <div className="w-full max-w-2xl rounded-2xl border p-6 text-sm text-black/60 dark:text-white/60">
            Tidak ada cover image
          </div>
        )}

        {/* Fields */}
        {isEdit ? (
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border p-3 bg-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />

            <input
              className="w-full rounded-xl border p-3 bg-transparent"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="Slug"
            />

            <textarea
              className="w-full rounded-xl border p-3 min-h-[160px] bg-transparent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Content"
            />

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Published
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border p-4">
              <div className="text-xl font-semibold">{post.title}</div>
              <div className="text-sm text-black/60 dark:text-white/60 whitespace-pre-wrap mt-2">
                {post.content?.trim() ? post.content : "Tidak ada konten"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
