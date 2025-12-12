import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") ?? "mycms";
  const timestamp = Math.floor(Date.now() / 1000);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

  // params yang di-sign harus sama persis dengan yang dikirim dari client
  const params: Record<string, string> = {
    folder,
    timestamp: String(timestamp),
  };

  if (uploadPreset.trim()) {
    params.upload_preset = uploadPreset.trim();
  }

  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const signature = sha1(toSign + apiSecret);

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    uploadPreset: uploadPreset.trim() || null,
  });
}
