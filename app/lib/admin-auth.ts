import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * Get the admin JWT secret from environment variables
 * Throws an error if not configured to prevent security issues
 */
export function getAdminJWTSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;

  if (!secret) {
    throw new Error(
      "ADMIN_JWT_SECRET environment variable is not configured. " +
      "This is required for admin authentication. " +
      "Please add ADMIN_JWT_SECRET to your .env file."
    );
  }

  return secret;
}

/**
 * Verify admin JWT token from request headers or httpOnly cookie
 * Returns the decoded token payload if valid, null otherwise
 */
type AdminTokenPayload = jwt.JwtPayload & {
  email?: string;
  role?: string;
};

function decodeAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getAdminJWTSecret());
    if (typeof decoded !== "object" || decoded.role !== "admin") {
      return null;
    }

    return decoded as AdminTokenPayload;
  } catch (error) {
    return null;
  }
}

export function verifyAdminToken(
  request: NextRequest,
): AdminTokenPayload | null {
  try {
    const authHeader =
      request.headers.get("authorization") ??
      request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (bearerToken) {
      const decoded = decodeAdminToken(bearerToken);
      if (decoded) {
        return decoded;
      }
    }

    const token = cookies().get("admin_token")?.value;

    if (!token) {
      return null;
    }

    return decodeAdminToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to check if request has valid admin authentication
 * Returns error response if not authenticated, null if valid
 */
export function requireAdminAuth(request: NextRequest): Response | null {
  const decoded = verifyAdminToken(request);

  if (!decoded) {
    return new Response(
      JSON.stringify({ error: "Unauthorized - Invalid or missing admin token" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  return null;
}

export function isAdminAuthError(error: unknown): boolean {
  return (
    error instanceof Error &&
    ["No token provided", "Invalid token", "Not authorized"].includes(
      error.message,
    )
  );
}
