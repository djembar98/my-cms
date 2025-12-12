import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function bytesToGB(bytes: number) {
  return bytes / 1024 / 1024 / 1024;
}

export async function POST() {
  try {
    const usage = await cloudinary.api.usage();

    const bytes: number | null =
      usage?.storage?.usage ??
      usage?.storage?.used ??
      usage?.storage_usage ??
      null;

    if (typeof bytes !== "number") {
      return NextResponse.json({ ok: true, note: "no storage info" });
    }

    const limitBytes = 25 * 1024 * 1024 * 1024; // target kamu
    const pct = Math.min(100, Math.round((bytes / limitBytes) * 100));
    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (pct >= 85) {
      // anti duplikat: cek ada warning hari ini
      const { data: exists } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("type", "warning")
        .ilike("title", `%Disk hampir penuh%`)
        .gte("created_at", `${todayKey}T00:00:00.000Z`)
        .lt("created_at", `${todayKey}T23:59:59.999Z`)
        .limit(1);

      if (!exists || exists.length === 0) {
        await supabaseAdmin.from("notifications").insert({
          type: "warning",
          title: `Disk hampir penuh (${pct}%)`,
          body: `Storage Cloudinary terpakai ${bytesToGB(bytes).toFixed(
            2
          )} GB dari 25 GB. Bersihkan file yang tidak dipakai.`,
          href: "/dashboard/static",
        });
      }
    }

    return NextResponse.json({ ok: true, pct });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
