import { NextResponse, type NextRequest } from "next/server";
import { createBlogTopic, listAdminTopics, parseBlogTopicInput } from "@/lib/blog/admin";
import { authorizeAdmin, errorResponse, readJsonBody } from "../_shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    return NextResponse.json(await listAdminTopics());
  } catch (error) {
    return errorResponse(error, "Error fetching blog topics");
  }
}

export async function POST(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    const id = await createBlogTopic(parseBlogTopicInput(await readJsonBody(req)));
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Error creating blog topic");
  }
}
