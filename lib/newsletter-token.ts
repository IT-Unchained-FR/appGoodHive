import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.NEWSLETTER_TOKEN_SECRET || process.env.ADMIN_JWT_SECRET;

  if (!secret) {
    throw new Error(
      "NEWSLETTER_TOKEN_SECRET (or ADMIN_JWT_SECRET) environment variable is not configured.",
    );
  }

  return secret;
}

function sign(userId: string): string {
  return createHmac("sha256", getSecret()).update(userId).digest("base64url");
}

/**
 * Stateless unsubscribe token: no DB storage or expiry, so links in old
 * emails keep working. Verified with a timing-safe HMAC comparison.
 */
export function createUnsubscribeToken(userId: string): string {
  return Buffer.from(`${userId}.${sign(userId)}`, "utf8").toString("base64url");
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const separatorIndex = decoded.lastIndexOf(".");
    if (separatorIndex === -1) return null;

    const userId = decoded.slice(0, separatorIndex);
    const signature = decoded.slice(separatorIndex + 1);

    const provided = Buffer.from(signature);
    const expected = Buffer.from(sign(userId));

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}
