import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-jwt-secret-key",
);

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "admin-jwt-secret-key",
);

export async function middleware(req: NextRequest) {
  // Check if the request is for an admin route
  if (req.nextUrl.pathname.startsWith("/admin")) {
    // Skip middleware for admin login page
    if (req.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminToken = req.cookies.get("admin_token")?.value;
    const adminLoginUrl = new URL("/admin/login", req.url);

    if (!adminToken) {
      return NextResponse.redirect(adminLoginUrl);
    }

    try {
      const { payload } = await jwtVerify(adminToken, ADMIN_JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      console.error("Admin token verification failed:", error);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // Skip middleware for public routes
  if (
    req.nextUrl.pathname.startsWith("/auth") ||
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Handle protected routes
  const sessionToken = req.cookies.get("session_token")?.value;
  const loginUrl = new URL("/auth/login", req.url);

  if (!sessionToken) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify the session token
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);

    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.user_id as string);
    requestHeaders.set("x-user-email", payload.email as string);
    requestHeaders.set("x-user-wallet", payload.wallet_address as string);

    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Session token verification failed:", error);
    return NextResponse.redirect(loginUrl);
  }
}

// Configure the routes where this middleware applies
export const config = {
  matcher: [
    "/talents/my-profile/:path*",
    "/talents/my-profile",
    "/companies/my-profile",
    "/admin/:path*",
  ],
};
