import { NextResponse } from "next/server";
import { uploadBytes } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Diagnostic: attempt a tiny R2 upload + public read from this (Vercel) runtime.
 * Used to isolate whether R2 credentials/endpoint work independent of the worker.
 */
export async function GET() {
  try {
    const key = `health/ping-${Date.now()}.txt`;
    const url = await uploadBytes(key, "clipmax r2 ok", "text/plain");
    let publicRead: number | string = "skipped";
    try {
      const r = await fetch(url, { cache: "no-store" });
      publicRead = r.status;
    } catch (e) {
      publicRead = e instanceof Error ? e.message : "fetch failed";
    }
    return NextResponse.json({ ok: true, url, publicRead });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        endpoint:
          process.env.S3_ENDPOINT ??
          (process.env.R2_ACCOUNT_ID
            ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
            : "missing"),
        bucket: process.env.S3_BUCKET ?? process.env.R2_BUCKET ?? "missing",
      },
      { status: 500 },
    );
  }
}
