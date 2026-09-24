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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
      UPDATE goodhive.knowledge_base_files
      SET slug = ${slug}, title = ${title}, content = ${content},
          updated_by = ${adminEmail}, updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING id, slug, title, content, updated_by, created_at, updated_at;
    `;

    if (!row) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("Error updating knowledge base file:", error);
    if (isAdminAuthError(error)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A file with that slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating knowledge base file" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await verifyAdminToken(req);

    const [row] = await sql`
      DELETE FROM goodhive.knowledge_base_files
      WHERE id = ${params.id}
      RETURNING id;
    `;

    if (!row) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting knowledge base file:", error);
    if (isAdminAuthError(error)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Error deleting knowledge base file" }, { status: 500 });
  }
}
