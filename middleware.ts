import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getToken } from "next-auth/jwt";

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

  // Handle protected routes for authenticated users
  const token = await getToken({ req });
  const isAuth = !!token;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/auth/login") ||
    req.nextUrl.pathname.startsWith("/auth/signup");

  // If trying to access auth pages while logged in, redirect to home
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // If trying to access protected routes while not logged in, redirect to login
  if (!isAuth) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configure the routes where this middleware applies
export const config = {
  matcher: [
    "/talents/my-profile/:path*",
    "/talents/my-profile",
    "/companies/my-profile",
    "/admin/:path*",
    "/auth/login",
    "/auth/signup",
  ],
};
