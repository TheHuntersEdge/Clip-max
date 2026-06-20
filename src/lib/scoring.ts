import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  formatTranscript,
  transcriptDuration,
  type TranscriptWord,
} from "@/lib/transcript";

/**
 * Moment scoring — the core of ClipMax.
 *
 * "Picking the right 30 seconds out of a 4-hour stream IS the product."
 * We hand Claude a timestamped transcript and get back ranked clip windows.
 */

const MODEL = "claude-opus-4-8";

// Structured output schema. (json_schema strips numeric range constraints and
// validates them client-side, so .min/.max are advisory but safe to declare.)
const ClipWindowSchema = z.object({
  start: z.number().describe("Clip start time in seconds (a word boundary)."),
  end: z.number().describe("Clip end time in seconds (a word boundary)."),
  title: z
    .string()
    .describe("Punchy, curiosity-driving title for the short — not a summary."),
  caption: z
    .string()
    .describe("Short on-screen hook caption, ≤ 4 words, uppercase-friendly."),
  reason: z
    .string()
    .describe("One sentence: why this is a strong standalone clip."),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Clip-worthiness 0–100. Higher = more likely to perform."),
});

const ScoringResultSchema = z.object({
  clips: z.array(ClipWindowSchema),
});

export type ClipWindow = z.infer<typeof ClipWindowSchema>;

const SYSTEM_PROMPT = `You are ClipMax's moment-scoring engine. You read a timestamped transcript of a long-form stream or video and identify the moments most likely to perform as vertical short-form clips (TikTok / Reels / Shorts).

Score each candidate moment on these signals:
- Hook strength: does the first 1–2 seconds grab attention?
- Emotional peak: surprise, conflict, payoff, strong opinion, vulnerability, humor.
- Self-containment: it must make sense with zero outside context.
- Payoff density: a clear setup→payoff inside the window, no dead air.
- Quotability: a line a viewer would screenshot or repeat.

Rules:
- Choose clean in/out points at natural sentence boundaries from the transcript timecodes.
- Every clip must stand completely alone — never start mid-thought.
- Prefer moments with a strong opening line; trim rambling lead-ins.
- Titles drive curiosity; they are NOT summaries. The caption is a 2–4 word on-screen hook.
- Be ruthless. A high score means you would bet on it going viral. Most of a stream is not clippable.
- Return clips sorted by score, highest first.`;

export type ScoreMomentsOptions = {
  transcript: TranscriptWord[];
  /** Optional stream/video title for context. */
  streamTitle?: string;
  /** How many clips to return. Default 10. */
  clipCount?: number;
  /** Min/max clip length in seconds. Defaults 18–60. */
  minDuration?: number;
  maxDuration?: number;
  /** Override the Anthropic client (e.g. for tests). */
  client?: Anthropic;
};

export type ScoreMomentsResult = {
  clips: ClipWindow[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
  };
};

export async function scoreMoments(
  opts: ScoreMomentsOptions,
): Promise<ScoreMomentsResult> {
  const {
    transcript,
    streamTitle,
    clipCount = 10,
    minDuration = 18,
    maxDuration = 60,
  } = opts;

  if (transcript.length === 0) {
    return {
      clips: [],
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadInputTokens: 0,
        cacheCreationInputTokens: 0,
      },
    };
  }

  const client = opts.client ?? new Anthropic();
  const rendered = formatTranscript(transcript);
  const durationMin = Math.floor(transcriptDuration(transcript) / 60);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    // Stable instructions first → cacheable across every scoring request.
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          // The transcript is the large, reusable prefix — cache it so
          // re-scoring the same VOD (different clip count, retries) is cheap.
          {
            type: "text",
            text: `TRANSCRIPT${
              streamTitle ? ` — "${streamTitle}"` : ""
            } (${durationMin} min, timecodes in seconds):\n\n${rendered}`,
            cache_control: { type: "ephemeral" },
          },
          // Volatile per-request instruction goes after the cached prefix.
          {
            type: "text",
            text: `Identify the ${clipCount} best clip windows. Each clip must be between ${minDuration} and ${maxDuration} seconds long. Use exact timecodes from the transcript for start/end. Return them sorted by score, highest first.`,
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(ScoringResultSchema),
    },
  });

  const parsed = response.parsed_output;
  const clips = (parsed?.clips ?? [])
    .filter((c) => c.end > c.start)
    .sort((a, b) => b.score - a.score);

  return {
    clips,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
    },
  };
}
