import { generateWithFallback } from "@/lib/ai/groq";

export interface OutreachEmailParams {
  talentName: string;
  talentTitle: string;
  talentSkills: string[];
  jobDescription: string;
}

export async function generateOutreachEmail(params: OutreachEmailParams): Promise<string> {
  const skillsList = params.talentSkills.slice(0, 8).join(", ") || "relevant skills";

  const prompt = `You are a recruiter writing a short, warm cold-outreach email to a freelance professional you discovered on GoodHive.

Talent you are reaching out to:
Name: ${params.talentName}
Title: ${params.talentTitle}
Key Skills: ${skillsList}

Role you are hiring for (job description):
${params.jobDescription.slice(0, 1500)}

Instructions:
- Write a 3-paragraph plain-text email (no subject line, no headers, no markdown).
- Paragraph 1: Brief intro — who you are (a recruiter on GoodHive) and why you noticed this person specifically (reference their title/skills naturally).
- Paragraph 2: One or two sentences on the role and why their background is a strong fit.
- Paragraph 3: Friendly call to action — invite them to reply if they are open to a quick chat.
- Keep the tone warm, direct, and professional. No fluff. No fake urgency.
- Do NOT invent specific company names, salaries, or experiences.
- Return ONLY the raw email body text.`;

  const text = await generateWithFallback(prompt, { feature: "outreach-email" });
  const cleaned = text.trim().replace(/^"+|"+$/g, "").trim();

  if (!cleaned || cleaned.length < 20) {
    throw new Error("AI outreach generation is temporarily unavailable. Please try again.");
  }

  return cleaned;
}
