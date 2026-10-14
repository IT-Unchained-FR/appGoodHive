import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession, verifyAdminToken } from "@/app/lib/admin-auth";
import { BlogValidationError } from "@/lib/blog/admin";

/** 401 unless the caller is an admin; otherwise the admin's email for `updated_by`. */
export function authorizeAdmin(req: NextRequest): { error: Response } | { email: string } {
  const unauthorized = requireAdminSession();
  if (unauthorized) return { error: unauthorized };
  const decoded = verifyAdminToken(req) as { email?: string } | null;
  return { email: decoded?.email ?? "unknown" };
}

export async function readJsonBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    throw new BlogValidationError("Request body must be JSON");
  }
}

export function errorResponse(error: unknown, fallback: string) {
  if (error instanceof BlogValidationError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  console.error(fallback, error);
  return NextResponse.json({ message: fallback }, { status: 500 });
}
