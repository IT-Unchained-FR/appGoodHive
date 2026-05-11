import { getGeminiModel } from "@/lib/gemini";

export interface OutreachEmailParams {
  talentName: string;
  talentTitle: string;
  talentSkills: string[];
  jobDescription: string;
}

function getOutreachModels() {
  const configured = [
    process.env.GEMINI_CHAT_MODEL?.trim(),
    process.env.GEMINI_FAST_MODEL?.trim(),
  ];
  const defaults = [
    "models/gemini-2.5-flash",
    "models/gemini-flash-latest",
    "models/gemini-2.0-flash",
  ];
  const all = [...configured, ...defaults];
  return all.filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);
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

  const modelNames = getOutreachModels();

  for (const modelName of modelNames) {
    try {
      const model = getGeminiModel(modelName);
      const result = await model.generateContent(prompt);
      const response = result.response as unknown as {
        text?: (() => string) | string;
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text =
        typeof response?.text === "function"
          ? response.text()
          : typeof response?.text === "string"
            ? response.text
            : (response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");

      const cleaned = text.trim().replace(/^"+|"+$/g, "").trim();
      if (cleaned.length > 20) {
        return cleaned;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`generateOutreachEmail failed with ${modelName}: ${msg}`);
    }
  }

  throw new Error("AI outreach generation is temporarily unavailable. Please try again.");
}
