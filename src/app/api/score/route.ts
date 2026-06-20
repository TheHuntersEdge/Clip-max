import { NextResponse } from "next/server";
import { scoreMoments } from "@/lib/scoring";
import type { TranscriptWord } from "@/lib/transcript";

export const runtime = "nodejs";
export const maxDuration = 300;

type ScoreRequest = {
  transcript: TranscriptWord[];
  streamTitle?: string;
  clipCount?: number;
  minDuration?: number;
  maxDuration?: number;
};

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 503 },
    );
  }

  let body: ScoreRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.transcript) || body.transcript.length === 0) {
    return NextResponse.json(
      { error: "`transcript` must be a non-empty array of word objects." },
      { status: 400 },
    );
  }

  try {
    const result = await scoreMoments({
      transcript: body.transcript,
      streamTitle: body.streamTitle,
      clipCount: body.clipCount,
      minDuration: body.minDuration,
      maxDuration: body.maxDuration,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
