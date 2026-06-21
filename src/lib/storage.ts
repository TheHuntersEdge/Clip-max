import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";

/**
 * Cloudflare R2 storage (S3-compatible). Holds source VODs and finished clips.
 *
 * Env:
 *   R2_ACCOUNT_ID         - Cloudflare account id
 *   R2_ACCESS_KEY_ID      - R2 API token access key
 *   R2_SECRET_ACCESS_KEY  - R2 API token secret
 *   R2_BUCKET             - bucket name
 *   R2_PUBLIC_BASE_URL    - public base for finished clips (r2.dev or custom domain)
 */

let client: S3Client | null = null;

function r2(): S3Client {
  if (client) return client;
  const accountId = required("R2_ACCOUNT_ID");
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    // R2's wildcard cert covers only *.r2.cloudflarestorage.com (one level), so
    // virtual-hosted style (bucket.account.r2…) fails TLS. Path-style keeps the
    // bucket in the path and the host at a single subdomain.
    forcePathStyle: true,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured.`);
  return v;
}

/** Upload a local file to R2 and return its public URL. */
export async function uploadFile(
  localPath: string,
  key: string,
  contentType: string,
): Promise<string> {
  const body = await readFile(localPath);
  await r2().send(
    new PutObjectCommand({
      Bucket: required("R2_BUCKET"),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  const base = required("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  return `${base}/${key}`;
}
