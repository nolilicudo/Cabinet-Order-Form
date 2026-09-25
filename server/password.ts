// Password hashing and verification using Node's built-in crypto (scrypt).
// No external dependencies required.

import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * Hash a plaintext password. Returns a string in the format:
 * `<hex-salt>:<hex-hash>` — safe to store in a VARCHAR(255) column.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

/**
 * Verify a plaintext password against a stored hash produced by hashPassword().
 * Returns true only if the password matches.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const hash = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
  const storedBuf = Buffer.from(storedHash, "hex");
  // Constant-time comparison prevents timing attacks.
  if (hash.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(hash, storedBuf);
}
