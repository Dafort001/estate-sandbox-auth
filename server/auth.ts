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
  try {
    // Validate hash format (salt:key)
    const parts = hashedPassword.split(":");
    if (parts.length !== 2) {
      return false;
    }

    const [salt, key] = parts;
    
    // Validate salt and key are present
    if (!salt || !key) {
      return false;
    }

    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = (await scryptAsync(password, salt, SCRYPT_OPTIONS.keylen)) as Buffer;
    
    // Ensure buffers have the same length before comparing
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }
    
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch (error) {
    // Invalid hash format or crypto error - return false instead of throwing
    console.error("Password verification error:", error);
    return false;
  }
}

// Session configuration
export const SESSION_CONFIG = {
  expiresIn: 1000 * 60 * 60 * 24 * 30, // 30 days in milliseconds
  cookieName: "auth_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
  },
};

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
