import { prisma } from "@/lib/prisma";
import { adapterFor } from "@/lib/publish";
import { ClipStatus, PostStatus } from "@/generated/prisma/client";

/**
 * Fan out every READY clip (that isn't scheduled yet) to all connected social
 * accounts as SCHEDULED posts, staggered so they publish over time.
 */
export async function scheduleReadyClips(opts: { intervalSec?: number } = {}) {
  const intervalSec = opts.intervalSec ?? 60;
  const accounts = await prisma.socialAccount.findMany();
  if (accounts.length === 0) {
    return { scheduled: 0, clips: 0, accounts: 0, reason: "no connected accounts" };
  }

  const clips = await prisma.clip.findMany({
    where: { status: ClipStatus.READY, renderUrl: { not: null }, posts: { none: {} } },
    select: { id: true },
  });

  let scheduled = 0;
  let slot = 0;
  for (const clip of clips) {
    for (const account of accounts) {
      await prisma.post.create({
        data: {
          clipId: clip.id,
          accountId: account.id,
          status: PostStatus.SCHEDULED,
          scheduledAt: new Date(Date.now() + slot * intervalSec * 1000),
        },
      });
      scheduled++;
      slot++;
    }
    await prisma.clip.update({
      where: { id: clip.id },
      data: { status: ClipStatus.SCHEDULED },
    });
  }
  return { scheduled, clips: clips.length, accounts: accounts.length };
}

/**
 * Publish every post whose scheduled time has arrived, via its platform adapter,
 * recording status + metrics. Marks a clip POSTED once all its posts are done.
 */
export async function processDuePosts(limit = 25) {
  const due = await prisma.post.findMany({
    where: { status: PostStatus.SCHEDULED, scheduledAt: { lte: new Date() } },
    take: limit,
    include: { clip: true, account: true },
  });

  let posted = 0;
  for (const post of due) {
    try {
      const adapter = adapterFor(post.account.platform, !!post.account.externalId);
      const result = await adapter.publish({
        platform: post.account.platform,
        handle: post.account.handle,
        followers: post.account.followers,
        clipId: post.clipId,
        title: post.clip.title,
        renderUrl: post.clip.renderUrl,
        externalId: post.account.externalId,
      });
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: PostStatus.POSTED,
          postedAt: new Date(),
          metrics: { ...result.metrics, url: result.url, externalId: result.externalId },
        },
      });
      posted++;
    } catch (err) {
      await prisma.post.update({
        where: { id: post.id },
        data: { status: PostStatus.FAILED, metrics: { error: String(err).slice(0, 500) } },
      });
    }
  }

  // Promote clips to POSTED when nothing is left scheduled for them.
  const clipIds = [...new Set(due.map((p) => p.clipId))];
  for (const clipId of clipIds) {
    const remaining = await prisma.post.count({
      where: { clipId, status: PostStatus.SCHEDULED },
    });
    if (remaining === 0) {
      await prisma.clip.update({
        where: { id: clipId },
        data: { status: ClipStatus.POSTED },
      });
    }
  }

  return { posted, due: due.length };
}
