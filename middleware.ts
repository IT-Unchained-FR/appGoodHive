import Cookies from "js-cookie";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
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
  ], // Protect specific routes
};
