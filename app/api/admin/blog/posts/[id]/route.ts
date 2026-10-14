import { NextResponse, type NextRequest } from "next/server";
import {
  deleteBlogPost,
  getAdminPost,
  isUuid,
  parseBlogPostInput,
  updateBlogPost,
} from "@/lib/blog/admin";
import { authorizeAdmin, errorResponse, readJsonBody } from "../../_shared";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const notFound = () => NextResponse.json({ message: "Article not found" }, { status: 404 });

export async function GET(req: NextRequest, { params }: Params) {
  const auth = authorizeAdmin(req);
  if ("error" in auth) return auth.error;
  if (!isUuid(params.id)) return notFound();
  try {
    const post = await getAdminPost(params.id);
    return post ? NextResponse.json(post) : notFound();
  } catch (error) {
    return errorResponse(error, "Error fetching blog article");
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = authorizeAdmin(req);
  if ("error" in auth) return auth.error;
  if (!isUuid(params.id)) return notFound();
  try {
    const input = parseBlogPostInput(await readJsonBody(req));
    const updated = await updateBlogPost(params.id, input, auth.email);
    return updated ? NextResponse.json({ id: params.id, slug: input.slug }) : notFound();
  } catch (error) {
    return errorResponse(error, "Error saving blog article");
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = authorizeAdmin(req);
  if ("error" in auth) return auth.error;
  if (!isUuid(params.id)) return notFound();
  try {
    return (await deleteBlogPost(params.id)) ? NextResponse.json({ ok: true }) : notFound();
  } catch (error) {
    return errorResponse(error, "Error deleting blog article");
  }
}
