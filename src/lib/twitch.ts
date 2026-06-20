import crypto from "crypto";

/**
 * Twitch Helix API client + EventSub helpers.
 *
 * Uses an app access token (client_credentials) for Helix calls and EventSub
 * subscription management. Webhook payloads are verified with HMAC against
 * TWITCH_EVENTSUB_SECRET.
 */

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const HELIX = "https://api.twitch.tv/helix";
const EVENTSUB_URL = `${HELIX}/eventsub/subscriptions`;

export type TwitchUser = {
  id: string;
  login: string;
  display_name: string;
  broadcaster_type: string;
  profile_image_url: string;
};

export type TwitchVideo = {
  id: string;
  stream_id: string | null;
  user_id: string;
  title: string;
  url: string;
  duration: string;
  created_at: string;
};

function clientId(): string {
  const id = process.env.TWITCH_CLIENT_ID;
  if (!id) throw new Error("TWITCH_CLIENT_ID is not configured.");
  return id;
}

// Cache the app token across requests in a single server instance.
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAppToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!secret) throw new Error("TWITCH_CLIENT_SECRET is not configured.");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: secret,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) {
    throw new Error(`Twitch token request failed: ${res.status}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.token;
}

async function helix<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = await getAppToken();
  const url = new URL(`${HELIX}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Client-Id": clientId() },
  });
  if (!res.ok) throw new Error(`Twitch Helix ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function getUserByLogin(login: string): Promise<TwitchUser | null> {
  const json = await helix<{ data: TwitchUser[] }>("/users", { login });
  return json.data[0] ?? null;
}

/** Most recent archived VOD for a channel (what we'd pull to clip). */
export async function getLatestVod(userId: string): Promise<TwitchVideo | null> {
  const json = await helix<{ data: TwitchVideo[] }>("/videos", {
    user_id: userId,
    type: "archive",
    first: "1",
  });
  return json.data[0] ?? null;
}

/**
 * Subscribe to stream.online + stream.offline for a broadcaster via EventSub
 * webhook transport. Returns the created subscription ids.
 */
export async function subscribeToStreamEvents(
  broadcasterUserId: string,
  callbackUrl: string,
): Promise<{ created: string[]; errors: string[] }> {
  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  if (!secret) throw new Error("TWITCH_EVENTSUB_SECRET is not configured.");
  const token = await getAppToken();

  const created: string[] = [];
  const errors: string[] = [];

  for (const type of ["stream.online", "stream.offline"]) {
    const res = await fetch(EVENTSUB_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": clientId(),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type,
        version: "1",
        condition: { broadcaster_user_id: broadcasterUserId },
        transport: { method: "webhook", callback: callbackUrl, secret },
      }),
    });
    const json = (await res.json()) as { data?: { id: string }[]; message?: string };
    if (res.ok && json.data?.[0]) created.push(json.data[0].id);
    else errors.push(`${type}: ${res.status} ${json.message ?? ""}`.trim());
  }
  return { created, errors };
}

/* ---------- EventSub webhook verification ---------- */

export const EVENTSUB_HEADERS = {
  id: "twitch-eventsub-message-id",
  timestamp: "twitch-eventsub-message-timestamp",
  signature: "twitch-eventsub-message-signature",
  type: "twitch-eventsub-message-type",
  subscriptionType: "twitch-eventsub-subscription-type",
} as const;

/**
 * Verify an EventSub webhook payload. `rawBody` MUST be the exact request body
 * string — re-serializing the JSON changes the bytes and breaks the HMAC.
 */
export function verifyEventSubMessage(
  headers: Headers,
  rawBody: string,
): boolean {
  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  if (!secret) return false;
  const id = headers.get(EVENTSUB_HEADERS.id);
  const timestamp = headers.get(EVENTSUB_HEADERS.timestamp);
  const signature = headers.get(EVENTSUB_HEADERS.signature);
  if (!id || !timestamp || !signature) return false;

  const hmac =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(id + timestamp + rawBody)
      .digest("hex");

  // Constant-time compare; lengths must match or timingSafeEqual throws.
  const a = Buffer.from(hmac);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
