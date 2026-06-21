import type { SocialPlatform } from "@/generated/prisma/client";

/**
 * Publishing adapter layer.
 *
 * - dryRunAdapter: simulates a post (used until a real provider is configured).
 * - uploadPostAdapter: posts for real via Upload-Post (https://upload-post.com),
 *   a multi-account social posting API. One integration → TikTok/IG/YT/FB/etc.
 *
 * adapterFor() returns the real adapter when UPLOADPOST_API_KEY is set AND the
 * account is linked to an Upload-Post profile; otherwise it falls back to dry-run.
 * Swapping to Ayrshare (for scale) later is just another adapter here.
 */

export type PublishInput = {
  platform: SocialPlatform;
  handle: string;
  followers: number;
  clipId: string;
  title: string | null;
  renderUrl: string | null;
  /** Provider profile id (Upload-Post `user`) this account is linked to. */
  externalId: string | null;
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

/** Upload-Post uses lowercase platform slugs. */
const UPLOAD_POST_PLATFORM: Record<SocialPlatform, string> = {
  TIKTOK: "tiktok",
  INSTAGRAM: "instagram",
  YOUTUBE: "youtube",
  FACEBOOK: "facebook",
};

/** Simulates a successful post. No real API call. */
export const dryRunAdapter: PublishAdapter = {
  name: "dry-run",
  async publish(input) {
    const externalId = "dry_" + Math.random().toString(36).slice(2, 10);
    const host = PLATFORM_HOST[input.platform];
    const handle = input.handle.replace(/^@/, "");
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

/** Posts for real via Upload-Post's multi-account API. */
export const uploadPostAdapter: PublishAdapter = {
  name: "upload-post",
  async publish(input) {
    const key = process.env.UPLOADPOST_API_KEY;
    if (!key) throw new Error("UPLOADPOST_API_KEY is not configured.");
    if (!input.externalId)
      throw new Error(`account ${input.handle} is not linked to an Upload-Post profile.`);
    if (!input.renderUrl) throw new Error("clip has no renderUrl to post.");

    const form = new FormData();
    form.append("video", input.renderUrl); // public URL is accepted directly
    form.append("title", input.title ?? "");
    form.append("user", input.externalId);
    form.append("platform[]", UPLOAD_POST_PLATFORM[input.platform]);

    const res = await fetch("https://api.upload-post.com/api/upload", {
      method: "POST",
      headers: { Authorization: `Apikey ${key}` },
      body: form,
    });
    const json = (await res.json().catch(() => ({}))) as {
      publish_id?: string;
      id?: string;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(`Upload-Post ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
    }
    return {
      externalId: String(json.publish_id ?? json.id ?? "up_unknown"),
      // Upload-Post returns a publish_id; the live post URL is fetched async.
      url: input.renderUrl,
      metrics: { views: 0, likes: 0, shares: 0 },
    };
  },
};

export function adapterFor(platform: SocialPlatform, linked: boolean): PublishAdapter {
  if (process.env.UPLOADPOST_API_KEY && linked) return uploadPostAdapter;
  return dryRunAdapter;
}
