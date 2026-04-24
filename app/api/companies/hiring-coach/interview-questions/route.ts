import { NextRequest, NextResponse } from "next/server";

import {
  buildInterviewQuestionsPrompt,
  findOwnedApplication,
  findOwnedJob,
  getHiringCoachContext,
  normalizeInterviewQuestionsResult,
  parseHiringCoachJson,
} from "@/lib/ai/company-hiring-coach";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { getGeminiModel } from "@/lib/gemini";

export const dynamic = "force-dynamic";

function readGeminiText(response: unknown) {
  const rawResponse = response as {
    text?: () => string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return (
    typeof rawResponse?.text === "function"
      ? rawResponse.text()
      : rawResponse?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  ).trim();
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { jobId?: unknown; applicationId?: unknown };
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    const applicationId =
      typeof body.applicationId === "number"
        ? body.applicationId
        : typeof body.applicationId === "string" && body.applicationId.trim()
          ? Number(body.applicationId)
          : null;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 });
    }

    if (applicationId !== null && !Number.isInteger(applicationId)) {
      return NextResponse.json(
        { success: false, error: "applicationId must be a valid application id" },
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

    const job = findOwnedJob(context, jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const application =
      applicationId === null ? null : findOwnedApplication(context, jobId, applicationId);
    if (applicationId !== null && !application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    const prompt = buildInterviewQuestionsPrompt(context, { job, application });
    const modelName = process.env.GEMINI_CHAT_MODEL ?? process.env.GEMINI_FAST_MODEL ?? "gemini-2.0-flash";
    const model = getGeminiModel(modelName);
    const result = await model.generateContent(prompt);
    const parsed = parseHiringCoachJson(
      readGeminiText(result.response),
      normalizeInterviewQuestionsResult,
    );

    if (!parsed) {
      return NextResponse.json(
        { success: false, error: "AI returned an invalid format. Please try again." },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true, data: parsed }, { status: 200 });
  } catch (error) {
    console.error("Hiring coach interview questions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate interview questions" },
      { status: 500 },
    );
  }
}
