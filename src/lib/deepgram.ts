import type { TranscriptWord } from "@/lib/transcript";

/**
 * Deepgram transcription — audio/video URL → word-level timestamps.
 *
 * Deepgram can pull a media URL directly, so this stage needs no storage of
 * its own. Output matches TranscriptWord[] and feeds straight into scoreMoments().
 */

const LISTEN_URL = "https://api.deepgram.com/v1/listen";

type DeepgramWord = {
  word: string;
  start: number;
  end: number;
  punctuated_word?: string;
};

export type TranscribeResult = {
  words: TranscriptWord[];
  durationSec: number;
};

function params(model?: string): string {
  return new URLSearchParams({
    model: model ?? "nova-2",
    smart_format: "true",
    punctuate: "true",
  }).toString();
}

function parseResult(json: {
  metadata?: { duration?: number };
  results?: { channels?: { alternatives?: { words?: DeepgramWord[] }[] }[] };
}): TranscribeResult {
  const dgWords = json.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
  const words: TranscriptWord[] = dgWords.map((w) => ({
    word: w.punctuated_word ?? w.word,
    start: w.start,
    end: w.end,
  }));
  const durationSec =
    json.metadata?.duration ?? (words.length ? words[words.length - 1].end : 0);
  return { words, durationSec };
}

function key(): string {
  const k = process.env.DEEPGRAM_API_KEY;
  if (!k) throw new Error("DEEPGRAM_API_KEY is not configured.");
  return k;
}

/** Transcribe a media URL Deepgram can fetch (used by the manual clip-job). */
export async function transcribeUrl(
  url: string,
  opts: { model?: string } = {},
): Promise<TranscribeResult> {
  const res = await fetch(`${LISTEN_URL}?${params(opts.model)}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${key()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    throw new Error(`Deepgram transcription failed: ${res.status} ${await res.text()}`);
  }
  return parseResult(await res.json());
}

/** Transcribe raw audio bytes (used by the worker on the extracted wav). */
export async function transcribeBuffer(
  audio: Uint8Array,
  opts: { model?: string; contentType?: string } = {},
): Promise<TranscribeResult> {
  const res = await fetch(`${LISTEN_URL}?${params(opts.model)}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${key()}`,
      "content-type": opts.contentType ?? "audio/wav",
    },
    // undici accepts a Uint8Array/Buffer body at runtime; the cast sidesteps
    // a TS lib mismatch (ArrayBufferLike vs ArrayBuffer).
    body: audio as unknown as BodyInit,
  });
  if (!res.ok) {
    throw new Error(`Deepgram transcription failed: ${res.status} ${await res.text()}`);
  }
  return parseResult(await res.json());
}
