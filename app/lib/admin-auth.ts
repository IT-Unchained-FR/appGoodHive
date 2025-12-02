import { NextRequest } from "next/server";
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
 * Verify admin JWT token from request headers
 * Returns the decoded token payload if valid, null otherwise
 */
export function verifyAdminToken(request: NextRequest): any {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return null;
    }

    const secret = getAdminJWTSecret();
    const decoded = jwt.verify(token, secret);

    return decoded;
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
    return Response.json(
      { error: "Unauthorized - Invalid or missing admin token" },
      { status: 401 }
    );
  }

  return null;
}
