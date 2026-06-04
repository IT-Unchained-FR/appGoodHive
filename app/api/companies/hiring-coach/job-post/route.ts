import { NextRequest, NextResponse } from "next/server";

import {
  buildJobPostCoachPrompt,
  findOwnedJob,
  getHiringCoachContext,
  normalizeJobPostResult,
  parseHiringCoachJson,
} from "@/lib/ai/company-hiring-coach";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { generateWithFallback } from "@/lib/ai/groq";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { jobId?: unknown; draftText?: unknown };
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    const draftText = typeof body.draftText === "string" ? body.draftText.trim() : "";

    if (!jobId && draftText.length < 20) {
      return NextResponse.json(
        { success: false, error: "Select a job or enter at least 20 characters of draft text" },
        { status: 400 },
      );
    }

    if (draftText.length > 6000) {
      return NextResponse.json(
        { success: false, error: "Draft text is too long (max 6000 chars)" },
        { status: 400 },
      );
    }

    const context = await getHiringCoachContext(sessionUser.user_id);
    if (!context) {
      return NextResponse.json(
        { success: false, error: "Company profile not found" },
        { status: 403 },
      );
    }

    const job = jobId ? findOwnedJob(context, jobId) : null;
    if (jobId && !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const prompt = buildJobPostCoachPrompt(context, { job, draftText });
    const text = await generateWithFallback(prompt, { feature: "hiring-coach-job-post" });
    const parsed = parseHiringCoachJson(text, normalizeJobPostResult);

    if (!parsed) {
      return NextResponse.json(
        { success: false, error: "AI returned an invalid format. Please try again." },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true, data: parsed }, { status: 200 });
  } catch (error) {
    console.error("Hiring coach job post error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to improve job post" },
      { status: 500 },
    );
  }
}
