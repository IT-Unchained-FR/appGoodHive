import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { getGeminiModel } from "@/lib/gemini";

export const dynamic = "force-dynamic";

interface GeneratedJD {
  title: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
}

function buildPrompt(params: {
  title: string;
  seniority: string;
  skills: string;
  workType: string;
  budget: string;
  tone: string;
  companyName: string;
  companyBio: string;
}): string {
  return `You are an expert recruiter writing for Web3 talent marketplace GoodHive.
Write a compelling job description for:

Role: ${params.title}
Seniority: ${params.seniority}
Key skills needed: ${params.skills}
Work type: ${params.workType}
Budget/Salary: ${params.budget || "Competitive, paid in USDC on Polygon"}
Company: ${params.companyName}
Company description: ${params.companyBio || "A Web3-native company on GoodHive"}
Tone: ${params.tone}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Final job title",
  "overview": "2-3 sentence role overview",
  "responsibilities": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "requirements": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "niceToHave": ["bullet 1", "bullet 2", "bullet 3"],
  "benefits": ["bullet 1", "bullet 2", "bullet 3"]
}`;
}

function toSectionContent(items: string[]): string {
  return items.map((item) => `• ${item}`).join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      title?: unknown;
      seniority?: unknown;
      skills?: unknown;
      workType?: unknown;
      budget?: unknown;
      tone?: unknown;
      companyName?: unknown;
      companyBio?: unknown;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ success: false, error: "title is required" }, { status: 400 });
    }

    const seniority = typeof body.seniority === "string" ? body.seniority : "Mid-level";
    const skills = typeof body.skills === "string" ? body.skills : "";
    const workType = typeof body.workType === "string" ? body.workType : "Remote";
    const budget = typeof body.budget === "string" ? body.budget : "";
    const tone = ["professional", "startup", "friendly"].includes(String(body.tone))
      ? String(body.tone)
      : "professional";
    const companyName = typeof body.companyName === "string" ? body.companyName : "Our company";
    const companyBio = typeof body.companyBio === "string" ? body.companyBio : "";

    const prompt = buildPrompt({ title, seniority, skills, workType, budget, tone, companyName, companyBio });

    const model = getGeminiModel("gemini-1.5-flash");
    const result = await model.generateContent(prompt);

    const rawResponse = result.response as unknown as {
      text?: () => string;
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const rawText =
      typeof rawResponse?.text === "function"
        ? rawResponse.text()
        : rawResponse?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown code fences if any
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let jd: GeneratedJD;
    try {
      jd = JSON.parse(cleaned) as GeneratedJD;
    } catch {
      return NextResponse.json({ success: false, error: "AI returned invalid format. Please try again." }, { status: 422 });
    }

    // Convert to IJobSection format
    const sections = [
      { heading: "Overview", content: jd.overview ?? "", sort_order: 0 },
      { heading: "Responsibilities", content: toSectionContent(jd.responsibilities ?? []), sort_order: 1 },
      { heading: "Requirements", content: toSectionContent(jd.requirements ?? []), sort_order: 2 },
      ...(jd.niceToHave?.length
        ? [{ heading: "Nice to Have", content: toSectionContent(jd.niceToHave), sort_order: 3 }]
        : []),
      ...(jd.benefits?.length
        ? [{ heading: "What We Offer", content: toSectionContent(jd.benefits), sort_order: 4 }]
        : []),
    ];

    return NextResponse.json({
      success: true,
      data: {
        title: jd.title || title,
        sections,
      },
    });
  } catch (error) {
    console.error("Job description generation error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate job description" }, { status: 500 });
  }
}
