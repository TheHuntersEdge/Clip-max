import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";

/**
 * S3-compatible object storage for finished clips. Provider-agnostic — works
 * with Backblaze B2, AWS S3, Cloudflare R2, etc. via env vars:
 *
 *   S3_ENDPOINT          - full endpoint URL (e.g. https://s3.us-west-004.backblazeb2.com)
 *   S3_REGION            - region (e.g. us-west-004); parsed from endpoint or "auto"
 *   S3_ACCESS_KEY_ID     - access key id
 *   S3_SECRET_ACCESS_KEY - secret access key
 *   S3_BUCKET            - bucket name
 *   S3_PUBLIC_BASE_URL   - public base URL for reads (clip playback)
 *
 * Legacy R2_* vars are still honored as a fallback.
 */

function env(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? (fallback ? process.env[fallback] : undefined);
}

function required(name: string, fallback?: string): string {
  const v = env(name, fallback);
  if (!v) throw new Error(`${name} is not configured.`);
  return v;
}

function endpoint(): string {
  const explicit = process.env.S3_ENDPOINT;
  if (explicit) return explicit;
  // Legacy R2 fallback: build from account id.
  const acc = process.env.R2_ACCOUNT_ID;
  if (acc) return `https://${acc}.r2.cloudflarestorage.com`;
  throw new Error("S3_ENDPOINT is not configured.");
}

function region(): string {
  if (process.env.S3_REGION) return process.env.S3_REGION;
  // Backblaze endpoints embed the region: s3.<region>.backblazeb2.com
  const m = (process.env.S3_ENDPOINT ?? "").match(/s3\.([a-z0-9-]+)\./);
  return m ? m[1] : "auto";
}

let client: S3Client | null = null;

function s3(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: region(),
    endpoint: endpoint(),
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("S3_ACCESS_KEY_ID", "R2_ACCESS_KEY_ID"),
      secretAccessKey: required("S3_SECRET_ACCESS_KEY", "R2_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

/** Upload raw bytes and return the public URL. */
export async function uploadBytes(
  key: string,
  body: Uint8Array | string,
  contentType: string,
): Promise<string> {
  await s3().send(
    new PutObjectCommand({
      Bucket: required("S3_BUCKET", "R2_BUCKET"),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  const base = required("S3_PUBLIC_BASE_URL", "R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  return `${base}/${key}`;
}

/** Upload a local file and return its public URL. */
export async function uploadFile(
  localPath: string,
  key: string,
  contentType: string,
): Promise<string> {
  const body = await readFile(localPath);
  return uploadBytes(key, body, contentType);
}
