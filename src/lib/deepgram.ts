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

export async function transcribeUrl(
  url: string,
  opts: { model?: string } = {},
): Promise<TranscribeResult> {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error("DEEPGRAM_API_KEY is not configured.");

  const params = new URLSearchParams({
    model: opts.model ?? "nova-2",
    smart_format: "true",
    punctuate: "true",
  });

  const res = await fetch(`${LISTEN_URL}?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Deepgram transcription failed: ${res.status} ${detail}`);
  }

  const json = (await res.json()) as {
    metadata?: { duration?: number };
    results?: {
      channels?: { alternatives?: { words?: DeepgramWord[] }[] }[];
    };
  };

  const dgWords =
    json.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
  const words: TranscriptWord[] = dgWords.map((w) => ({
    word: w.punctuated_word ?? w.word,
    start: w.start,
    end: w.end,
  }));

  const durationSec =
    json.metadata?.duration ?? (words.length ? words[words.length - 1].end : 0);

  return { words, durationSec };
}
