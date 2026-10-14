import { NextResponse, type NextRequest } from "next/server";
import { deleteBlogTopic, isUuid, parseBlogTopicInput, updateBlogTopic } from "@/lib/blog/admin";
import { authorizeAdmin, errorResponse, readJsonBody } from "../../_shared";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const notFound = () => NextResponse.json({ message: "Topic not found" }, { status: 404 });

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = authorizeAdmin(req);
  if ("error" in auth) return auth.error;
  if (!isUuid(params.id)) return notFound();
  try {
    const updated = await updateBlogTopic(params.id, parseBlogTopicInput(await readJsonBody(req)));
    return updated ? NextResponse.json({ id: params.id }) : notFound();
  } catch (error) {
    return errorResponse(error, "Error saving blog topic");
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = authorizeAdmin(req);
  if ("error" in auth) return auth.error;
  if (!isUuid(params.id)) return notFound();
  try {
    return (await deleteBlogTopic(params.id)) ? NextResponse.json({ ok: true }) : notFound();
  } catch (error) {
    return errorResponse(error, "Error deleting blog topic");
  }
}
