import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const SCRYPT_OPTIONS = {
  N: 16384, // CPU/memory cost parameter
  r: 8,     // Block size
  p: 1,     // Parallelization parameter
  keylen: 64,
};

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, SCRYPT_OPTIONS.keylen)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const [salt, key] = hashedPassword.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scryptAsync(password, salt, SCRYPT_OPTIONS.keylen)) as Buffer;
  
  return timingSafeEqual(keyBuffer, derivedKey);
}

// Session configuration
export const SESSION_CONFIG = {
  expiresIn: 1000 * 60 * 60 * 24 * 30, // 30 days
  cookieName: "auth_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
};

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
