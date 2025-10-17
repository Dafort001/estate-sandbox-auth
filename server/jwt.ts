import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

// JWT Configuration - SECRET is REQUIRED
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required for JWT authentication. " +
    "Set it to a secure random string (at least 32 characters)."
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  refreshTokenExpiry: number;
}

// Generate access token (short-lived)
export function generateAccessToken(userId: string, email: string): string {
  const payload: JWTPayload = { userId, email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

// Generate refresh token (long-lived)
export function generateRefreshToken(): { token: string; id: string; expiresAt: number } {
  const id = randomUUID();
  const token = randomUUID(); // Simple random token for refresh
  const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY_MS;
  
  return { token, id, expiresAt };
}

// Generate both tokens
export function generateTokenPair(userId: string, email: string): TokenPair {
  const accessToken = generateAccessToken(userId, email);
  const refresh = generateRefreshToken();
  
  return {
    accessToken,
    refreshToken: refresh.token,
    refreshTokenId: refresh.id,
    refreshTokenExpiry: refresh.expiresAt,
  };
}

// Verify access token
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Extract Bearer token from Authorization header
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  
  return parts[1];
}
