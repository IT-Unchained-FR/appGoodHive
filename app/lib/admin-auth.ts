import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

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
    const token = request.cookies.get("admin_token")?.value;

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
    return NextResponse.json(
      { error: "Unauthorized - Invalid or missing admin token" },
      { status: 401 }
    );
  }

  return null;
}

export function isAdminAuthError(error: unknown): boolean {
  return (
    error instanceof Error &&
    ["No token provided", "Invalid token", "Not authorized"].includes(error.message)
  );
}

/**
 * True when the current request carries a valid admin token. Reads cookies
 * via next/headers, so it works in server components and in route handlers
 * typed with a plain Request.
 */
export function hasAdminSession(): boolean {
  const token = cookies().get("admin_token")?.value;
  if (!token) return false;
  try {
    jwt.verify(token, getAdminJWTSecret());
    return true;
  } catch {
    return false;
  }
}

/** 401 response unless the request has a valid admin token. */
export function requireAdminSession(): Response | null {
  return hasAdminSession()
    ? null
    : NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
}
