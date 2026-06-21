import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

/**
 * Video pipeline helpers — shell out to yt-dlp and ffmpeg (provided by the
 * worker's Docker image). Everything streams to disk; nothing is loaded into
 * memory. These run on the worker host, never on Vercel.
 */

const FONT =
  process.env.CLIP_FONT_FILE ??
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

/** Download a VOD (Twitch/YouTube/direct URL) to a local mp4. */
export async function downloadVod(url: string, outPath: string): Promise<void> {
  await exec(
    "yt-dlp",
    [
      "-f",
      "bv*+ba/b",
      "--merge-output-format",
      "mp4",
      "--no-playlist",
      "-o",
      outPath,
      url,
    ],
    { maxBuffer: 1024 * 1024 * 16 },
  );
}

/** Extract a mono 16kHz wav for transcription. */
export async function extractAudio(
  inPath: string,
  outPath: string,
): Promise<void> {
  await exec("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    inPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    outPath,
  ]);
}

function escapeDrawText(text: string): string {
  // ffmpeg drawtext escaping: backslash, colon, single quote, percent.
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "’")
    .replace(/%/g, "\\%");
}

/**
 * Cut [start,end], reframe 16:9 → 9:16 (centered), and burn the caption.
 * Speaker-tracking reframe is Phase 2; this is a centered crop.
 */
export async function renderClip(opts: {
  inPath: string;
  start: number;
  end: number;
  caption: string;
  outPath: string;
}): Promise<void> {
  const { inPath, start, end, caption, outPath } = opts;
  const duration = Math.max(1, end - start);

  const reframe = "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920";
  const drawtext =
    `drawtext=fontfile='${FONT}':text='${escapeDrawText(caption.toUpperCase())}':` +
    `fontcolor=white:fontsize=72:borderw=6:bordercolor=black@0.9:` +
    `x=(w-text_w)/2:y=h-360:line_spacing=8`;

  await exec(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      start.toFixed(2),
      "-i",
      inPath,
      "-t",
      duration.toFixed(2),
      "-vf",
      `${reframe},${drawtext}`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-threads",
      "2",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outPath,
    ],
    { maxBuffer: 1024 * 1024 * 16 },
  );
}
