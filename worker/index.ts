/**
 * ClipMax render worker.
 *
 * Runs OFF Vercel (on Railway/Render/Fly) where yt-dlp + ffmpeg are available.
 * Polls Postgres for streams that ended (status PROCESSING) and runs the back
 * half of the loop:
 *
 *   download VOD (yt-dlp) → extract audio (ffmpeg) → transcribe (Deepgram)
 *   → score (Claude) → render each clip 9:16 + captions (ffmpeg) → upload (R2)
 *   → persist Clip rows → mark stream DONE.
 *
 * Run:  npx tsx worker/index.ts            (poll loop)
 *       npx tsx worker/index.ts <streamId> (process one stream and exit)
 */
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { prisma } from "@/lib/prisma";
import { transcribeBuffer } from "@/lib/deepgram";
import { scoreMoments } from "@/lib/scoring";
import { downloadVod, extractAudio, renderClip } from "@/lib/render";
import { uploadFile } from "@/lib/storage";
import { ClipStatus, StreamStatus } from "@/generated/prisma/client";

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 10_000);
const CLIPS_PER_STREAM = Number(process.env.CLIPS_PER_STREAM ?? 10);

async function processStream(streamId: string): Promise<void> {
  const stream = await prisma.stream.findUnique({ where: { id: streamId } });
  if (!stream) throw new Error(`stream ${streamId} not found`);
  if (!stream.vodUrl) {
    await prisma.stream.update({
      where: { id: streamId },
      data: { status: StreamStatus.FAILED },
    });
    throw new Error(`stream ${streamId} has no vodUrl`);
  }

  const work = await mkdtemp(join(tmpdir(), "clipmax-"));
  const vodPath = join(work, "vod.mp4");
  const audioPath = join(work, "audio.wav");

  try {
    log(`[${streamId}] downloading VOD…`);
    await downloadVod(stream.vodUrl, vodPath);

    log(`[${streamId}] extracting audio…`);
    await extractAudio(vodPath, audioPath);

    log(`[${streamId}] transcribing…`);
    const audio = await readFile(audioPath);
    const { words } = await transcribeBuffer(audio);
    if (words.length === 0) throw new Error("no speech found");

    log(`[${streamId}] scoring ${words.length} words…`);
    const { clips } = await scoreMoments({
      transcript: words,
      streamTitle: stream.title ?? undefined,
      clipCount: CLIPS_PER_STREAM,
    });
    log(`[${streamId}] ${clips.length} clips selected, rendering…`);

    let i = 0;
    for (const c of clips) {
      i++;
      const outPath = join(work, `clip-${i}.mp4`);
      await renderClip({
        inPath: vodPath,
        start: c.start,
        end: c.end,
        caption: c.caption,
        outPath,
      });
      const key = `clips/${streamId}/${i}-${Date.now()}.mp4`;
      const renderUrl = await uploadFile(outPath, key, "video/mp4");

      await prisma.clip.create({
        data: {
          streamId,
          start: c.start,
          end: c.end,
          title: c.title,
          caption: c.caption,
          reason: c.reason,
          score: c.score,
          status: ClipStatus.READY,
          renderUrl,
        },
      });
      log(`[${streamId}] clip ${i}/${clips.length} → ${renderUrl}`);
    }

    await prisma.stream.update({
      where: { id: streamId },
      data: { status: StreamStatus.DONE },
    });
    log(`[${streamId}] DONE — ${clips.length} clips`);
  } catch (err) {
    await prisma.stream.update({
      where: { id: streamId },
      data: { status: StreamStatus.FAILED },
    });
    throw err;
  } finally {
    // Cost control: delete the source VOD after clipping (brief §render cost).
    await rm(work, { recursive: true, force: true });
  }
}

/** Claim the oldest finished stream that still needs clipping. */
async function nextStream(): Promise<string | null> {
  const s = await prisma.stream.findFirst({
    where: { status: StreamStatus.PROCESSING, vodUrl: { not: null } },
    orderBy: { endedAt: "asc" },
  });
  return s?.id ?? null;
}

function log(msg: string) {
  console.log(`${new Date().toISOString()} ${msg}`);
}

async function main() {
  const oneShot = process.argv[2];
  if (oneShot) {
    await processStream(oneShot);
    await prisma.$disconnect();
    return;
  }

  log(`worker started — polling every ${POLL_MS}ms`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const id = await nextStream();
      if (id) await processStream(id);
      else await sleep(POLL_MS);
    } catch (err) {
      console.error("worker error:", err);
      await sleep(POLL_MS);
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
