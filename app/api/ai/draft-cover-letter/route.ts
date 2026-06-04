import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/sessionUtils";
import { generateWithFallback } from "@/lib/ai/groq";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.user_id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      jobTitle?: string;
      companyName?: string;
      jobId?: string;
    };

    const { jobTitle, companyName, jobId } = body;

    if (!jobTitle) {
      return NextResponse.json(
        { success: false, error: "jobTitle is required" },
        { status: 400 }
      );
    }

    const talentRows = await sql<{
      first_name: string | null;
      last_name: string | null;
      title: string | null;
      skills: string | null;
      about_work: string | null;
    }[]>`
      SELECT first_name, last_name, title, skills, about_work
      FROM goodhive.talents
      WHERE user_id = ${sessionUser.user_id}
      LIMIT 1
    `;

    const talent = talentRows[0];
    if (!talent) {
      return NextResponse.json(
        { success: false, error: "Talent profile not found" },
        { status: 404 }
      );
    }

    const talentName = [talent.first_name, talent.last_name].filter(Boolean).join(" ");
    const talentTitle = talent.title || "Web3 Professional";
    const talentSkills = talent.skills || "various skills";

    let decodedAboutWork = "";
    if (talent.about_work) {
      try {
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (base64Regex.test(talent.about_work)) {
          decodedAboutWork = Buffer.from(talent.about_work, "base64").toString("utf-8");
        } else {
          decodedAboutWork = talent.about_work;
        }
      } catch {
        decodedAboutWork = talent.about_work;
      }
    }

    decodedAboutWork = decodedAboutWork.replace(/<[^>]*>?/gm, " ").substring(0, 500);

    let jobContext = "";
    if (jobId) {
      const sections = await sql<{ heading: string; content: string }[]>`
        SELECT heading, content
        FROM goodhive.job_sections
        WHERE job_id = ${jobId}::uuid
        ORDER BY sort_order ASC
        LIMIT 5
      `;
      if (sections.length > 0) {
        jobContext = sections
          .map((s) => `${s.heading}:\n${s.content.replace(/<[^>]*>?/gm, " ")}`)
          .join("\n\n")
          .substring(0, 1000);
      }
    }

    const prompt = `You are an expert career coach writing a highly personalized, concise cover letter for a Web3 talent applying for a job on GoodHive.

Candidate Information:
Name: ${talentName}
Title: ${talentTitle}
Top Skills: ${talentSkills}
Bio: ${decodedAboutWork}

Job Information:
Job Title: ${jobTitle}
Company: ${companyName || "the company"}
Job Details:
${jobContext}

Task:
Write a concise, professional, and friendly 3-4 sentence cover letter for this application.
- Do NOT use formal headers (e.g. no "Dear Hiring Manager," or "Sincerely, [Name]"). Just write the body paragraphs.
- Focus on how the candidate's skills directly align with the job title.
- Keep the tone enthusiastic but professional (Web3 startup vibe).
- Do not make up fake experiences; rely strictly on the provided skills and title.
- It must be ready to copy-paste into a small text box.

Return ONLY the raw text of the cover letter.`;

    let generatedText = await generateWithFallback(prompt);
    generatedText = generatedText.trim().replace(/^"/, "").replace(/"$/, "").trim();

    return NextResponse.json({
      success: true,
      data: { coverLetter: generatedText },
    });
  } catch (error) {
    console.error("Cover letter generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
