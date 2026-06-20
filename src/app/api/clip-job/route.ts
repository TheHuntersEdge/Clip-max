import { NextResponse } from "next/server";
import { transcribeUrl } from "@/lib/deepgram";
import { scoreMoments } from "@/lib/scoring";

export const runtime = "nodejs";
export const maxDuration = 300;

type ClipJobRequest = {
  url: string;
  title?: string;
  clipCount?: number;
  minDuration?: number;
  maxDuration?: number;
};

/**
 * The ClipMax loop, minus VOD download/render: media URL → Deepgram transcript
 * → Claude-scored clip windows. Returns the ranked clips for review.
 */
export async function POST(req: Request) {
  if (!process.env.DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY is not configured." },
      { status: 503 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 503 },
    );
  }

  let body: ClipJobRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.url || !/^https?:\/\//.test(body.url)) {
    return NextResponse.json(
      { error: "`url` must be an http(s) link to an audio or video file." },
      { status: 400 },
    );
  }

  try {
    const { words, durationSec } = await transcribeUrl(body.url);
    if (words.length === 0) {
      return NextResponse.json(
        { error: "No speech found in that media." },
        { status: 422 },
      );
    }

    const { clips, usage } = await scoreMoments({
      transcript: words,
      streamTitle: body.title,
      clipCount: body.clipCount,
      minDuration: body.minDuration,
      maxDuration: body.maxDuration,
    });

    return NextResponse.json({
      clips,
      meta: { wordCount: words.length, durationSec, usage },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Clip job failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
