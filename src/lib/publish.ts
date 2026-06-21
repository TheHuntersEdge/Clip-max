import type { SocialPlatform } from "@/generated/prisma/client";

/**
 * Publishing adapter layer. Each platform gets an adapter implementing
 * `publish(clip → account)`. Real adapters (YouTube, TikTok, …) register in
 * REAL; everything else falls back to the dry-run adapter, which simulates a
 * successful post so the whole autopilot flow works without platform approval.
 */

export type PublishInput = {
  platform: SocialPlatform;
  handle: string;
  followers: number;
  clipId: string;
  title: string | null;
  renderUrl: string | null;
};

export type PublishResult = {
  externalId: string;
  url: string;
  metrics: { views: number; likes: number; shares: number };
};

export interface PublishAdapter {
  readonly name: string;
  publish(input: PublishInput): Promise<PublishResult>;
}

const PLATFORM_HOST: Record<SocialPlatform, string> = {
  TIKTOK: "tiktok.com",
  INSTAGRAM: "instagram.com",
  YOUTUBE: "youtube.com",
  FACEBOOK: "facebook.com",
};

/** Simulates a successful post. No real API call. */
export const dryRunAdapter: PublishAdapter = {
  name: "dry-run",
  async publish(input) {
    const externalId = "dry_" + Math.random().toString(36).slice(2, 10);
    const host = PLATFORM_HOST[input.platform];
    const handle = input.handle.replace(/^@/, "");
    // Plausible initial reach based on the account's audience.
    const reach = Math.max(
      50,
      Math.floor(input.followers * (0.15 + Math.random() * 0.5)),
    );
    return {
      externalId,
      url: `https://${host}/${handle}/clip/${input.clipId}`,
      metrics: {
        views: reach,
        likes: Math.floor(reach * 0.06),
        shares: Math.floor(reach * 0.012),
      },
    };
  },
};

// Real adapters register here as they're built.
const REAL: Partial<Record<SocialPlatform, PublishAdapter>> = {};

export function adapterFor(platform: SocialPlatform): PublishAdapter {
  return REAL[platform] ?? dryRunAdapter;
}
