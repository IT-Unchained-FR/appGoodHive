import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

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
    console.log("adminToken", adminToken);
    // Define the login URL for admin
    const adminLoginUrl = new URL("/admin/login", req.url);

    // If no admin token is present, redirect to admin login
    if (!adminToken) {
      return NextResponse.redirect(adminLoginUrl);
    }

    try {
      // Verify the admin token
      const { payload } = await jwtVerify(adminToken, ADMIN_JWT_SECRET);
      console.log("user", payload);
      return NextResponse.next();
    } catch (error) {
      console.log("error", error);
      // If token is invalid, redirect to admin login
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // Handle non-admin protected routes
  const user_id = req.cookies.get("user_id")?.value;

  // Define the login URL
  const loginUrl = new URL("/auth/login", req.url);

  // If no token is present, redirect to login
  if (!user_id) {
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to proceed
  return NextResponse.next();
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
