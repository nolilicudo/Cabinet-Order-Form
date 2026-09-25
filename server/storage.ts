// Cloudflare R2 storage helpers
// Uses the AWS S3-compatible API to upload (PUT) and generate presigned GET URLs.
// The public API surface is identical to the old Forge-based storage:
//   storagePut   – upload a file, returns { key, url }
//   storageGet   – resolve a key to a URL (presigned or proxy path)
//   storageGetSignedUrl – get a time-limited presigned download URL

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

// ---------------------------------------------------------------------------
// Client factory (lazy singleton)
// ---------------------------------------------------------------------------

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_client) return _client;

  const { r2AccountId, r2AccessKeyId, r2SecretAccessKey } = ENV;

  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
    throw new Error(
      "R2 storage config missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY",
    );
  }

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  return _client;
}

function getBucket(): string {
  if (!ENV.r2BucketName) {
    throw new Error("R2 storage config missing: set R2_BUCKET_NAME");
  }
  return ENV.r2BucketName;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upload a file to R2.
 * Returns `{ key, url }` where `url` is either a presigned GET URL (if no
 * R2_PUBLIC_URL is configured) or the permanent public URL.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const bucket = getBucket();
  const key = appendHashSuffix(normalizeKey(relKey));

  const body =
    typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  // Return a proxy path so the client always uses the /storage route (which
  // generates a fresh presigned URL on each request).
  return { key, url: `/storage/${key}` };
}

/**
 * Resolve a stored key to a URL.
 * Returns the proxy path; the proxy handler will redirect to a presigned URL.
 */
export async function storageGet(
  relKey: string,
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/storage/${key}` };
}

/**
 * Generate a time-limited presigned GET URL for a stored key.
 * Default expiry: 1 hour (3600 seconds).
 */
export async function storageGetSignedUrl(
  relKey: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucket();
  const key = normalizeKey(relKey);

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}
