import { NextResponse } from "next/server";
import { listKnowledgeQuestions } from "@/lib/superbot/knowledge";

export const dynamic = "force-dynamic";

export async function GET() {
  const questions = await listKnowledgeQuestions();
  return NextResponse.json({ questions });
}
