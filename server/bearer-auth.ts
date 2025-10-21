import { randomBytes, createHash } from "crypto";
import type { Context } from "hono";
import { db } from "./db";
import { personalAccessTokens, users } from "../shared/schema";
import { eq, and, gt } from "drizzle-orm";

export type TokenScopes = 
  | "upload:raw"
  | "view:gallery"
  | "ai:run"
  | "order:read"
  | "order:write"
  | "admin:all";

export interface BearerAuthPayload {
  userId: string;
  tokenId: string;
  scopes: TokenScopes[];
  userRole: "client" | "admin";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateBearerToken(): { token: string; hashedToken: string } {
  const token = `pat_${randomBytes(32).toString("hex")}`;
  const hashedToken = hashToken(token);
  return { token, hashedToken };
}

export async function validateBearerToken(
  token: string
): Promise<BearerAuthPayload | null> {
  if (!token || !token.startsWith("pat_")) {
    return null;
  }

  const hashedToken = hashToken(token);
  const now = Date.now();

  const result = await db
    .select({
      tokenId: personalAccessTokens.id,
      userId: personalAccessTokens.userId,
      scopes: personalAccessTokens.scopes,
      expiresAt: personalAccessTokens.expiresAt,
      revokedAt: personalAccessTokens.revokedAt,
      userRole: users.role,
    })
    .from(personalAccessTokens)
    .innerJoin(users, eq(users.id, personalAccessTokens.userId))
    .where(
      and(
        eq(personalAccessTokens.token, hashedToken),
        gt(personalAccessTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const tokenData = result[0];

  if (tokenData.revokedAt !== null) {
    return null;
  }

  const scopes = tokenData.scopes.split(",").filter(Boolean) as TokenScopes[];

  await db
    .update(personalAccessTokens)
    .set({ lastUsedAt: now })
    .where(eq(personalAccessTokens.id, tokenData.tokenId));

  return {
    userId: tokenData.userId,
    tokenId: tokenData.tokenId,
    scopes,
    userRole: tokenData.userRole as "client" | "admin",
  };
}

export function hasScope(
  payload: BearerAuthPayload,
  requiredScope: TokenScopes
): boolean {
  if (payload.scopes.includes("admin:all")) {
    return true;
  }
  return payload.scopes.includes(requiredScope);
}

export async function bearerAuthMiddleware(
  c: Context,
  requiredScopes?: TokenScopes[]
): Promise<BearerAuthPayload | null> {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await validateBearerToken(token);

  if (!payload) {
    return null;
  }

  if (requiredScopes && requiredScopes.length > 0) {
    const hasAllScopes = requiredScopes.every((scope) =>
      hasScope(payload, scope)
    );
    if (!hasAllScopes) {
      return null;
    }
  }

  return payload;
}
