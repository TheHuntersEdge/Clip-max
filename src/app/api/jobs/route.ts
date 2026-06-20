import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SourcePlatform, StreamStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";

/**
 * Manually enqueue a render job: creates a PROCESSING stream with a VOD URL
 * that the worker will pick up (download → transcribe → score → render → R2).
 * Used to exercise the full loop without waiting for a live Twitch stream.
 */
export async function POST(req: Request) {
  let body: { vodUrl?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.vodUrl || !/^https?:\/\//.test(body.vodUrl)) {
    return NextResponse.json(
      { error: "`vodUrl` must be an http(s) link." },
      { status: 400 },
    );
  }

  // Minimal workspace/source so the Stream FK chain is satisfied. Real jobs
  // attach to the connected Twitch source created during channel connect.
  const workspace = await prisma.workspace.upsert({
    where: { id: "manual" },
    update: {},
    create: { id: "manual", name: "Manual jobs" },
  });
  const source = await prisma.source.upsert({
    where: {
      platform_channelId: {
        platform: SourcePlatform.YOUTUBE,
        channelId: "manual",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      platform: SourcePlatform.YOUTUBE,
      channelId: "manual",
    },
  });

  const stream = await prisma.stream.create({
    data: {
      sourceId: source.id,
      title: body.title,
      vodUrl: body.vodUrl,
      status: StreamStatus.PROCESSING,
      endedAt: new Date(),
    },
  });

  return NextResponse.json({ streamId: stream.id, status: stream.status });
}
