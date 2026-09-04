import { randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

/** scrypt password hashing via Node's built-in crypto — no extra dependency
 * (bcrypt/argon2 would need a native module). Stored as "salt:hash", both
 * hex-encoded, so a single string column holds everything needed to verify. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedBuf = Buffer.from(hashHex, "hex");
  if (storedBuf.length !== derived.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

/** 6-digit numeric forgot-password code — short enough to read from an
 * email and type back in. Its limited entropy relies on a short expiry
 * (see REQUEST_PASSWORD_RESET_* below) rather than being the sole barrier. */
export function generateResetCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function resetCodeSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set. Copy .env.example to .env and configure it.");
  return secret;
}

/** HMAC keyed by AUTH_SECRET, not a plain hash — a database leak alone
 * isn't enough to brute-force the 6-digit code space offline, the app
 * secret is also required. */
export function hashResetCode(code: string): string {
  return createHmac("sha256", resetCodeSecret()).update(code).digest("hex");
}

export function verifyResetCode(code: string, storedHash: string): boolean {
  const expected = Buffer.from(hashResetCode(code), "hex");
  const actual = Buffer.from(storedHash, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
