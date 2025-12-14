"use client";

import { useState } from "react";
import { Image as ImageIcon, UploadCloud } from "lucide-react";

type UploadOk = {
  secure_url: string;
  public_id: string;
};

type UploadErr = {
  error: { message: string };
};

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export function CoverUpload({
  folder,
  value,
  onChange,
}: {
  folder: string; // "mycms/posts" | "mycms/products"
  value?: { url?: string; publicId?: string };
  onChange: (v: { url: string; publicId: string }) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function upload(file: File) {
    setLoading(true);

    const sigRes = await fetch(
      `/api/cloudinary/sign?folder=${encodeURIComponent(folder)}`
    );
    const sig: {
      cloudName: string;
      apiKey: string;
      timestamp: number;
      signature: string;
      folder: string;
      uploadPreset: string | null;
    } = await sigRes.json();

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    if (sig.uploadPreset) form.append("upload_preset", sig.uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      { method: "POST", body: form }
    );

    const data: UploadOk | UploadErr = await res.json();

    setLoading(false);

    if ("error" in data) throw new Error(data.error.message);

    onChange({ url: data.secure_url, publicId: data.public_id });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Image
        </div>

        <label
          className={cx(
            "inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition",
            "border-slate-200/70 bg-white/60 hover:bg-white/80",
            "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
            loading && "opacity-60 pointer-events-none"
          )}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              upload(f).catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : "Upload gagal";
                alert(msg);
              });
            }}
          />
          <UploadCloud className="h-4 w-4 opacity-85" />
          {loading ? "Uploading..." : "Upload"}
        </label>
      </div>

      {value?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.url}
          alt="cover"
          className={cx(
            "w-full max-w-md rounded-3xl border object-cover",
            "border-white/20 bg-white/40",
            "shadow-[0_20px_60px_-35px_rgba(2,6,23,0.25)]",
            "dark:border-white/10 dark:bg-white/5"
          )}
        />
      ) : (
        <div
          className={cx(
            "w-full max-w-md rounded-3xl border p-6",
            "border-white/20 bg-white/45 backdrop-blur-xl",
            "dark:border-white/10 dark:bg-white/5"
          )}
        >
          <div className="flex items-center gap-2 text-sm text-slate-700/70 dark:text-slate-300/70">
            <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/20 bg-white/40 dark:border-white/10 dark:bg-white/5">
              <ImageIcon className="h-4 w-4 opacity-80" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                Belum ada image
              </div>
              <div className="text-xs text-slate-600/70 dark:text-slate-300/60">
                Upload cover untuk tampilan lebih rapi.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
