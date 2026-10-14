import { NextResponse, type NextRequest } from "next/server";
import { createBlogPost, listAdminPosts, parseBlogPostInput } from "@/lib/blog/admin";
import { authorizeAdmin, errorResponse, readJsonBody } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    return NextResponse.json(await listAdminPosts());
  } catch (error) {
    return errorResponse(error, "Error fetching blog articles");
  }
}

export async function POST(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    const input = parseBlogPostInput(await readJsonBody(req));
    const id = await createBlogPost(input, auth.email);
    return NextResponse.json({ id, slug: input.slug }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Error creating blog article");
  }
}
