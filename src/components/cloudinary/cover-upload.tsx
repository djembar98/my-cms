"use client";

import { useState } from "react";

type UploadOk = {
  secure_url: string;
  public_id: string;
};

type UploadErr = {
  error: { message: string };
};

export function CoverUpload({
  folder,
  value,
  onChange,
}: {
  folder: string; // ✅ jadi reusable: "mycms/posts" atau "mycms/products"
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
      <div className="text-sm font-medium">Image</div>

      {value?.url ? (
        <img
          src={value.url}
          alt="cover"
          className="w-full max-w-md rounded-2xl border object-cover"
        />
      ) : (
        <div className="w-full max-w-md rounded-2xl border p-6 text-sm text-black/60 dark:text-white/60">
          Belum ada image
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10">
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
        {loading ? "Uploading..." : "Upload"}
      </label>
    </div>
  );
}
