import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyEventSubMessage,
  getLatestVod,
  EVENTSUB_HEADERS,
} from "@/lib/twitch";
import { SourcePlatform, StreamStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";

type EventSubBody = {
  challenge?: string;
  subscription?: { type: string };
  event?: {
    broadcaster_user_id: string;
    broadcaster_user_login?: string;
    id?: string; // stream id (stream.online)
    started_at?: string;
  };
};

export async function POST(req: Request) {
  // Raw body is required for HMAC — do not parse before verifying.
  const rawBody = await req.text();

  if (!verifyEventSubMessage(req.headers, rawBody)) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const messageType = req.headers.get(EVENTSUB_HEADERS.type);
  let body: EventSubBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new NextResponse("bad body", { status: 400 });
  }

  // 1. Subscription handshake — echo the challenge as plain text.
  if (messageType === "webhook_callback_verification") {
    return new NextResponse(body.challenge ?? "", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }

  // 2. Subscription revoked — acknowledge.
  if (messageType === "revocation") {
    return new NextResponse(null, { status: 204 });
  }

  // 3. Notification — handle stream lifecycle. Always 2xx so Twitch doesn't retry.
  if (messageType === "notification") {
    try {
      await handleNotification(body);
    } catch (err) {
      // Log but still acknowledge; we don't want Twitch hammering retries.
      console.error("EventSub handler error:", err);
    }
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, { status: 204 });
}

async function handleNotification(body: EventSubBody) {
  const type = body.subscription?.type;
  const channelId = body.event?.broadcaster_user_id;
  if (!type || !channelId) return;

  const source = await prisma.source.findUnique({
    where: {
      platform_channelId: { platform: SourcePlatform.TWITCH, channelId },
    },
  });
  // Webhook for a channel we don't track — acknowledge and move on.
  if (!source) return;

  if (type === "stream.online") {
    await prisma.stream.create({
      data: {
        sourceId: source.id,
        status: StreamStatus.LIVE,
        startedAt: body.event?.started_at
          ? new Date(body.event.started_at)
          : new Date(),
      },
    });
    return;
  }

  if (type === "stream.offline") {
    // Find the most recent live stream for this source and close it out.
    const live = await prisma.stream.findFirst({
      where: { sourceId: source.id, status: StreamStatus.LIVE },
      orderBy: { startedAt: "desc" },
    });

    // The VOD may not be published instantly; best-effort lookup.
    let vodUrl: string | undefined;
    try {
      const vod = await getLatestVod(channelId);
      vodUrl = vod?.url;
    } catch {
      /* VOD not ready yet — the fetch worker will retry. */
    }

    if (live) {
      await prisma.stream.update({
        where: { id: live.id },
        data: { status: StreamStatus.PROCESSING, endedAt: new Date(), vodUrl },
      });
    } else {
      await prisma.stream.create({
        data: {
          sourceId: source.id,
          status: StreamStatus.PROCESSING,
          endedAt: new Date(),
          vodUrl,
        },
      });
    }

    // TODO(Phase 1 worker): enqueue a VOD-fetch job here once the worker host
    // (Railway/Render/Fly + R2 storage) is provisioned. The job will:
    //   download VOD → Deepgram transcribe → scoreMoments() → FFmpeg render.
  }
}
