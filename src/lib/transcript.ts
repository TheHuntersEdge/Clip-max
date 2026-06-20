/**
 * Transcript types + helpers.
 *
 * Word-level timestamps are what Deepgram (and Whisper) return and what the
 * moment scorer needs to pick exact clip in/out points. We feed Claude a
 * compact, timestamped, line-chunked rendering rather than raw word JSON.
 */

export type TranscriptWord = {
  /** The word as spoken. */
  word: string;
  /** Start time in seconds from the beginning of the VOD. */
  start: number;
  /** End time in seconds. */
  end: number;
};

/**
 * Group words into timestamped lines so Claude can reason about ~sentence-level
 * spans while still seeing exact timecodes. Each line is prefixed with its start
 * time, e.g. `[1432.8] so here's the part nobody tells you about cold calling`.
 *
 * Lines break on a sentence-ending word or when `maxGap` seconds of silence
 * pass between words (a natural beat), whichever comes first.
 */
export function formatTranscript(
  words: TranscriptWord[],
  opts: { maxGap?: number; maxWordsPerLine?: number } = {},
): string {
  const maxGap = opts.maxGap ?? 1.2;
  const maxWordsPerLine = opts.maxWordsPerLine ?? 18;

  const lines: string[] = [];
  let current: TranscriptWord[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const start = current[0].start;
    const text = current.map((w) => w.word).join(" ");
    lines.push(`[${start.toFixed(1)}] ${text}`);
    current = [];
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = current[current.length - 1];
    const gap = prev ? w.start - prev.end : 0;

    if (prev && (gap >= maxGap || current.length >= maxWordsPerLine)) {
      flush();
    }
    current.push(w);

    if (/[.!?]$/.test(w.word)) flush();
  }
  flush();

  return lines.join("\n");
}

/** Total spoken duration covered by the transcript, in seconds. */
export function transcriptDuration(words: TranscriptWord[]): number {
  if (words.length === 0) return 0;
  return words[words.length - 1].end - words[0].start;
}
