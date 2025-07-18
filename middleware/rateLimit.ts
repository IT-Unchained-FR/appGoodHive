import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_REQUESTS = 500; // Increased from 100 to 500 requests per window
const LOGIN_MAX_REQUESTS = 10; // Increased from 5 to 20 login attempts per window

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// Note: In production, use Redis or similar for distributed systems
const rateLimitStore: RateLimitStore = {};

export function rateLimit(request: NextRequest) {
  const ip = request.ip || "unknown";
  const path = request.nextUrl.pathname;
  const now = Date.now();

  // Determine if it's a login request
  const isLoginRequest =
    path.includes("/api/auth/login") ||
    path.includes("/api/auth/signup") ||
    path.includes("/api/auth/verify") ||
    path.includes("/api/auth/wallet-login");

  const maxRequests = isLoginRequest ? LOGIN_MAX_REQUESTS : MAX_REQUESTS;
  const key = `${ip}:${isLoginRequest ? "auth" : "general"}`;

  // Clean up expired entries
  Object.keys(rateLimitStore).forEach((storeKey) => {
    if (rateLimitStore[storeKey].resetTime < now) {
      delete rateLimitStore[storeKey];
    }
  });

  // Get or create rate limit entry
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + WINDOW_SIZE,
    };
  }

  const entry = rateLimitStore[key];

  // Reset if window has expired
  if (entry.resetTime < now) {
    entry.count = 0;
    entry.resetTime = now + WINDOW_SIZE;
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);

    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        retryAfter: resetIn,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetIn.toString(),
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": entry.resetTime.toString(),
        },
      },
    );
  }

  // Add rate limit headers to successful responses
  const remaining = maxRequests - entry.count;
  const response = NextResponse.next();

  response.headers.set("X-RateLimit-Limit", maxRequests.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", entry.resetTime.toString());

  return response;
}
