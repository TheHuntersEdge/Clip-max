import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SocialPlatform } from "@/generated/prisma/client";

export const runtime = "nodejs";

export async function GET() {
  const accounts = await prisma.socialAccount.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ accounts });
}

const DEMO = [
  { platform: SocialPlatform.TIKTOK, handle: "@hunteruncut", followers: 24100 },
  { platform: SocialPlatform.INSTAGRAM, handle: "@hunteruncut", followers: 8300 },
  { platform: SocialPlatform.YOUTUBE, handle: "HunterUncut", followers: 12700 },
  { platform: SocialPlatform.TIKTOK, handle: "@hedge.clips", followers: 5200 },
];

/**
 * Create connected accounts to post to. With { demo: true } (or empty body),
 * seeds a few sample accounts if none exist yet. Otherwise creates one from
 * { platform, handle, followers }.
 */
export async function POST(req: Request) {
  const workspace = await prisma.workspace.upsert({
    where: { id: "manual" },
    update: {},
    create: { id: "manual", name: "Manual jobs" },
  });

  let body: {
    platform?: string;
    handle?: string;
    followers?: number;
    externalId?: string;
    demo?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    body = { demo: true };
  }

  if (body.platform && body.handle) {
    const account = await prisma.socialAccount.create({
      data: {
        workspaceId: workspace.id,
        platform: body.platform as SocialPlatform,
        handle: body.handle,
        followers: body.followers ?? 0,
        externalId: body.externalId ?? null,
      },
    });
    return NextResponse.json({ created: 1, accounts: [account] });
  }

  // demo seed
  const existing = await prisma.socialAccount.count();
  if (existing > 0) {
    return NextResponse.json({ created: 0, reason: "accounts already exist" });
  }
  const accounts = [];
  for (const d of DEMO) {
    accounts.push(
      await prisma.socialAccount.create({
        data: { workspaceId: workspace.id, ...d },
      }),
    );
  }
  return NextResponse.json({ created: accounts.length, accounts });
}
