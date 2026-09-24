import sql from "@/lib/ragDb";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminJWTSecret, isAdminAuthError } from "@/app/lib/admin-auth";

export const dynamic = "force-dynamic";

const verifyAdminToken = async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = verify(token, getAdminJWTSecret()) as { role: string; email?: string };
      if (decoded.role === "admin") return decoded;
    } catch (error) {
      // Fall through to cookie check
    }
  }

  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verify(token, getAdminJWTSecret()) as { role: string; email?: string };
    if (decoded.role !== "admin") {
      throw new Error("Not authorized");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function GET(req: NextRequest) {
  try {
    await verifyAdminToken(req);

    const rows = await sql`
      SELECT id, slug, title, content, updated_by, created_at, updated_at
      FROM goodhive.knowledge_base_files
      ORDER BY title ASC;
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching knowledge base files:", error);
    if (isAdminAuthError(error)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Error fetching knowledge base files" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyAdminToken(req);
    const adminEmail = (decoded as { email?: string }).email ?? "unknown";

    const body = await req.json();
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content : "";

    if (!slug || !SLUG_PATTERN.test(slug)) {
      return NextResponse.json(
        { message: "slug must be lowercase letters, numbers, and hyphens only (e.g. \"getting-started\")" },
        { status: 400 },
      );
    }
    if (!title) {
      return NextResponse.json({ message: "title is required" }, { status: 400 });
    }
    if (!content.trim()) {
      return NextResponse.json({ message: "content is required" }, { status: 400 });
    }

    const [row] = await sql`
      INSERT INTO goodhive.knowledge_base_files (slug, title, content, updated_by)
      VALUES (${slug}, ${title}, ${content}, ${adminEmail})
      RETURNING id, slug, title, content, updated_by, created_at, updated_at;
    `;

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Error creating knowledge base file:", error);
    if (isAdminAuthError(error)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A file with that slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating knowledge base file" }, { status: 500 });
  }
}
