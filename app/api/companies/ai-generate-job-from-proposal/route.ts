import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export const dynamic = "force-dynamic";

interface JobSection {
  heading: string;
  content: string;
  sort_order: number;
}

interface GeneratedJobData {
  title: string;
  sections: JobSection[];
  skills: string[];
  projectType: "fixed" | "hourly";
  typeEngagement: "freelance" | "remote" | "any";
  duration: string;
  estimatedBudget: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: string;
}

export async function POST(request: NextRequest) {
  try {
    const { jobProposal } = await request.json();

    if (!jobProposal || !jobProposal.trim()) {
      return NextResponse.json({ status: "error", message: "Job proposal is required" }, { status: 400 });
    }

    if (jobProposal.trim().length < 50) {
      return NextResponse.json({ status: "error", message: "Job proposal must be at least 50 characters" }, { status: 400 });
    }

    if (jobProposal.length > 5000) {
      return NextResponse.json({ status: "error", message: "Job proposal must not exceed 5000 characters" }, { status: 400 });
    }

    const prompt = `You are an expert HR professional and job posting specialist for GoodHive, a Web3 IT talent marketplace.

Analyze the following job proposal and extract all relevant information to create a comprehensive, professional job posting.

**Job Proposal:**
${jobProposal}

**Instructions:**
1. Extract or infer a professional job title (max 60 characters)
2. Create 4-6 well-structured sections with professional HTML content using <p>, <ul>, <li>, <strong> tags:
   - About the Role (overview, 150-200 words)
   - Key Responsibilities (4-6 bullet points)
   - Requirements & Qualifications (4-6 bullet points)
   - Preferred Skills (3-4 bullet points)
   - What We Offer (3-4 bullet points)
3. Extract 6-12 relevant technical skills
4. Determine: projectType (fixed or hourly), typeEngagement (freelance, remote, or any), duration, jobType (remote, hybrid, or onsite)
5. Estimate budget in USD if not provided

Duration must be one of: "lessThanSevenDays", "moreThanSevenDays", "moreThanOneMonth", "moreThanThreeMonths"

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Professional job title",
  "sections": [
    { "heading": "Section Name", "content": "HTML formatted content", "sort_order": 0 }
  ],
  "skills": ["skill1", "skill2"],
  "projectType": "fixed",
  "typeEngagement": "freelance",
  "duration": "moreThanOneMonth",
  "estimatedBudget": { "min": 1000, "max": 5000, "currency": "USD" },
  "jobType": "remote"
}`;

    const modelName = process.env.GEMINI_CHAT_MODEL ?? process.env.GEMINI_FAST_MODEL ?? "gemini-2.0-flash";
    const model = getGeminiModel(modelName);
    const result = await model.generateContent(prompt);

    const rawResponse = result.response as unknown as {
      text?: () => string;
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const rawText =
      typeof rawResponse?.text === "function"
        ? rawResponse.text()
        : rawResponse?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown fences if present
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let generatedData: GeneratedJobData;
    try {
      generatedData = JSON.parse(cleaned);
    } catch {
      console.error("Gemini response parsing error. Raw:", rawText);
      return NextResponse.json(
        { status: "error", message: "AI returned an invalid format. Please try again." },
        { status: 422 }
      );
    }

    if (!generatedData.title || !Array.isArray(generatedData.sections)) {
      return NextResponse.json(
        { status: "error", message: "AI response was incomplete. Please try again." },
        { status: 422 }
      );
    }

    // Sanitize sections
    const validatedSections = generatedData.sections
      .filter((s) => s.heading && s.content)
      .map((s, i) => ({ ...s, sort_order: i }));

    // Sanitize budget
    const budget =
      generatedData.estimatedBudget?.min && generatedData.estimatedBudget?.max
        ? generatedData.estimatedBudget
        : { min: 1500, max: 5000, currency: "USD" };

    const responseData: GeneratedJobData = {
      title: String(generatedData.title).substring(0, 100),
      sections: validatedSections,
      skills: (generatedData.skills ?? [])
        .filter((s) => typeof s === "string" && s.length > 1)
        .slice(0, 15),
      projectType: generatedData.projectType === "hourly" ? "hourly" : "fixed",
      typeEngagement: ["freelance", "remote", "any"].includes(generatedData.typeEngagement)
        ? generatedData.typeEngagement
        : "freelance",
      duration: ["lessThanSevenDays", "moreThanSevenDays", "moreThanOneMonth", "moreThanThreeMonths"].includes(
        generatedData.duration
      )
        ? generatedData.duration
        : "moreThanOneMonth",
      estimatedBudget: budget,
      jobType: ["remote", "hybrid", "onsite"].includes(generatedData.jobType)
        ? generatedData.jobType
        : "remote",
    };

    return NextResponse.json({ status: "success", data: responseData });
  } catch (error) {
    console.error("Error generating job from proposal:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to generate job posting. Please try again." },
      { status: 500 }
    );
  }
}
