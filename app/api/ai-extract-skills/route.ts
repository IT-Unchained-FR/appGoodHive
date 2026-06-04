import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/ai/groq";

export async function POST(request: NextRequest) {
  try {
    const { linkedinData } = await request.json();

    if (!linkedinData) {
      return NextResponse.json(
        { message: "LinkedIn data is required" },
        { status: 400 },
      );
    }

    const {
      position,
      about,
      experience = [],
      education = [],
      skills = [],
    } = linkedinData;

    const experienceText = experience
      .map(
        (exp: any) =>
          `${exp.title} at ${exp.company || ""}: ${exp.description || ""}`,
      )
      .join(" ");

    const educationText = education
      .map(
        (edu: any) =>
          `${edu.degree || ""} in ${edu.field || ""} from ${edu.title || ""}`,
      )
      .join(" ");

    const skillsPrompt = `
    You are an expert at identifying professional skills from LinkedIn profiles.

    Analyze the following LinkedIn profile data and extract ONLY relevant professional skills (both technical and soft skills).

    Profile Data:
    - Position/Title: "${position || ""}"
    - About/Summary: "${about || ""}"
    - Experience: "${experienceText}"
    - Education: "${educationText}"
    - Existing Skills: "${skills.map((s: any) => s.name || s).join(", ")}"

    Instructions:
    1. Extract ONLY actual professional skills (e.g., "React", "JavaScript", "Project Management", "Agile")
    2. Do NOT include individual words, articles, or non-skill terms
    3. Focus on technical skills, programming languages, frameworks, methodologies, and relevant soft skills
    4. Return a JSON array of skill strings only
    5. Maximum 15-20 most relevant skills
    6. Use standard skill names (e.g., "JavaScript" not "JS", "React" not "React.js")

    Return ONLY a valid JSON array like: ["React", "JavaScript", "Node.js", "Project Management"]
    `;

    const content = await generateWithFallback(skillsPrompt, { temperature: 0.3, feature: "extract-skills" });

    let extractedSkills: string[] = [];
    try {
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        extractedSkills = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing AI skills response:", parseError);
      extractedSkills = [];
    }

    if (!Array.isArray(extractedSkills)) {
      extractedSkills = [];
    }

    extractedSkills = extractedSkills
      .filter((skill) => typeof skill === "string" && skill.trim().length > 0)
      .map((skill) => skill.trim())
      .slice(0, 20);

    return NextResponse.json({
      status: "completed",
      data: { skills: extractedSkills },
    });
  } catch (error) {
    console.error("Error extracting skills with AI:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to extract skills with AI" },
      { status: 500 },
    );
  }
}
