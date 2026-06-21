import { NextResponse } from "next/server";
import { scheduleReadyClips } from "@/lib/posting";

export const runtime = "nodejs";

/** Fan out all READY clips to connected accounts as scheduled posts. */
export async function POST(req: Request) {
  let intervalSec = 60;
  try {
    const body = await req.json();
    if (typeof body?.intervalSec === "number") intervalSec = body.intervalSec;
  } catch {
    /* no body is fine */
  }
  const result = await scheduleReadyClips({ intervalSec });
  return NextResponse.json(result);
}
