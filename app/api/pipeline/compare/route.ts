import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { getSessionUser } from "@/lib/auth/sessionUtils";

interface CandidateInput {
  name: string;
  title: string | null;
  skills: string | null;
  bio: string | null;
  stage: string;
  experience: string | null;
  minRate: number | null;
  maxRate: number | null;
  availability: string | null;
  notes: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { candidates?: CandidateInput[]; jobContext?: string };
    const { candidates, jobContext } = body;

    if (!candidates || candidates.length < 2) {
      return NextResponse.json({ success: false, error: "At least 2 candidates required" }, { status: 400 });
    }

    const candidateBlocks = candidates
      .map((c, i) => {
        const skills = (c.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean).join(", ");
        const rateRange =
          c.minRate && c.maxRate
            ? `$${c.minRate}–$${c.maxRate}/hr`
            : c.minRate
              ? `from $${c.minRate}/hr`
              : c.maxRate
                ? `up to $${c.maxRate}/hr`
                : "Not specified";

        return `
### Candidate ${i + 1}: ${c.name}
- **Title**: ${c.title ?? "Not specified"}
- **Pipeline stage**: ${c.stage}
- **Skills**: ${skills || "None listed"}
- **Rate**: ${rateRange}
- **Availability**: ${c.availability ?? "Not specified"}
- **Bio**: ${c.bio ?? "No bio provided"}
- **Recruiter notes**: ${c.notes ?? "None"}
- **Experience**: ${c.experience ?? "Not specified"}
`.trim();
      })
      .join("\n\n");

    const jobCtx = jobContext?.trim() ? `\nJob context: ${jobContext}\n` : "";

    const prompt = `You are an expert technical recruiter helping compare candidates for a hiring decision.

${jobCtx}
${candidateBlocks}

Provide a concise, structured comparison covering:

1. **Overall Summary** (2–3 sentences comparing the candidates at a high level)
2. **Strengths** — list 2–3 bullet points per candidate, focusing on what makes them stand out
3. **Best Fit For** — what type of role or team each candidate would excel in (1–2 sentences each)
4. **Skill Gap Analysis** — any notable gaps or overlaps in their skill sets
5. **Recommendation** — which candidate to prioritize and why, or when each is the better choice

Be direct, practical, and concise. Format using markdown headings and bullets. Do not repeat candidate names unnecessarily. Keep the total response under 400 words.`;

    const modelName =
      process.env.GEMINI_CHAT_MODEL ?? process.env.GEMINI_FAST_MODEL ?? "llama-3.3-70b-versatile";
    const model = getGeminiModel(modelName);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 600 },
    });

    const text =
      typeof result.response.text === "function"
        ? result.response.text()
        : (result.response.text as string) ?? "";

    return NextResponse.json({ success: true, analysis: text });
  } catch (error) {
    console.error("AI compare error:", error);
    return NextResponse.json({ success: false, error: "AI comparison failed" }, { status: 500 });
  }
}
