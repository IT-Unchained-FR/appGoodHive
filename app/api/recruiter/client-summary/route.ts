import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/ai/groq";
import { getSessionUser } from "@/lib/auth/sessionUtils";

interface ClientSummaryInput {
  talent_name: string | null;
  talent_title: string | null;
  talent_skills: string | null;
  talent_bio: string | null;
  talent_experience: string | null;
  talent_min_rate: number | null;
  talent_max_rate: number | null;
  talent_availability: string | null;
  notes: string | null;
  anonymize?: boolean;
  jobContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ClientSummaryInput;
    const {
      talent_name,
      talent_title,
      talent_skills,
      talent_bio,
      talent_experience,
      talent_min_rate,
      talent_max_rate,
      talent_availability,
      notes,
      anonymize = false,
      jobContext,
    } = body;

    if (!talent_name && !talent_title) {
      return NextResponse.json({ success: false, error: "No candidate data provided" }, { status: 400 });
    }

    const displayName = anonymize ? "the candidate" : (talent_name ?? "the candidate");
    const skills = (talent_skills ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");

    const rateRange =
      talent_min_rate && talent_max_rate
        ? `$${talent_min_rate}–$${talent_max_rate}/hr`
        : talent_min_rate
          ? `from $${talent_min_rate}/hr`
          : talent_max_rate
            ? `up to $${talent_max_rate}/hr`
            : null;

    const jobCtxLine = jobContext?.trim() ? `\nRole context: ${jobContext}\n` : "";
    const notesLine = notes?.trim() ? `\nRecruiter notes: ${notes}\n` : "";

    const prompt = `You are a professional recruiter writing a polished candidate summary to share with a client company.

${jobCtxLine}
Candidate profile:
- Name: ${displayName}
- Title: ${talent_title ?? "Not specified"}
- Skills: ${skills || "Not listed"}
- Experience: ${talent_experience ?? "Not specified"}
- Rate: ${rateRange ?? "Flexible / not specified"}
- Availability: ${talent_availability ?? "Not specified"}
- Bio: ${talent_bio ?? "Not provided"}
${notesLine}

Write a professional, concise candidate summary (150–200 words) suitable for sending to a client.

Requirements:
- Start with a strong opening sentence that highlights their core value
- Mention 3–5 key technical skills naturally in the text
- Include availability and rate if known
- Sound warm and professional, not like a list of bullet points
- Do NOT use headers or markdown — plain prose only
- Do NOT mention the recruiter or GoodHive directly
- End with a clear call to action (e.g., "Happy to arrange an introduction call")
- If anonymized, do not use any name — just "this candidate" or "they/them"

Output the summary text only. No preamble, no explanation.`;

    const text = await generateWithFallback(prompt, { temperature: 0.6, maxTokens: 400, feature: "client-summary" });

    return NextResponse.json({ success: true, summary: text.trim() });
  } catch (error) {
    console.error("Client summary error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate summary" }, { status: 500 });
  }
}
