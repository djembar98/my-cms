"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export default function PostPage() {
  const supabase = createSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRow[]>([]);

  // create form
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<{ url: string; publicId: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => title.trim() && slug.trim(), [title, slug]);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id,title,slug,content,published,cover_url,cover_public_id,created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setPosts([]);
      setLoading(false);
      return;
    }

    setPosts((data ?? []) as PostRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createPost() {
    if (!canSave) return;

    setSaving(true);

    const { error } = await supabase.from("posts").insert({
      title: title.trim(),
      slug: slug.trim(),
      content: content.trim() || null,
      cover_url: cover?.url ?? null,
      cover_public_id: cover?.publicId ?? null,
      published: false,
    });

    setSaving(false);
    if (error) return alert(error.message);

    setTitle("");
    setSlug("");
    setContent("");
    setCover(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
        <div className="text-lg font-semibold">Post (Blog)</div>
        <div className="text-sm text-black/60 dark:text-white/60">
          Buat post baru dan kelola post yang sudah ada (klik untuk lihat
          detail).
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create */}
        <div className="rounded-2xl border bg-white p-5 space-y-4 dark:bg-neutral-950">
          <div className="font-semibold">Buat Post</div>

          <input
            className="w-full rounded-xl border p-3 bg-transparent"
            placeholder="Title"
            value={title}
            onChange={(e) => {
              const v = e.target.value;
              setTitle(v);
              if (!slug) setSlug(slugify(v));
            }}
          />

          <input
            className="w-full rounded-xl border p-3 bg-transparent"
            placeholder="Slug (unique)"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
          />

          <textarea
            className="w-full rounded-xl border p-3 min-h-[140px] bg-transparent"
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <CoverUpload
            folder="mycms/posts"
            value={
              cover ? { url: cover.url, publicId: cover.publicId } : undefined
            }
            onChange={(v) => setCover(v)}
          />

          <button
            disabled={saving || !canSave}
            onClick={createPost}
            className="w-full rounded-xl bg-black p-3 text-white disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {saving ? "Menyimpan..." : "Simpan Post"}
          </button>
        </div>

        {/* List */}
        <div className="rounded-2xl border bg-white p-5 dark:bg-neutral-950">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Daftar Post</div>
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
          ) : posts.length === 0 ? (
            <div className="text-sm text-black/60 dark:text-white/60">
              Belum ada post
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/post/${p.id}`}
                  className="block rounded-2xl border p-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        /{p.slug} • {p.published ? "Published" : "Draft"}
                      </div>
                    </div>

                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
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
