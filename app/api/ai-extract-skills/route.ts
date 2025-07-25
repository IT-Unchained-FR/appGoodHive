import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { linkedinData } = await request.json();

    if (!linkedinData) {
      return NextResponse.json(
        { message: "LinkedIn data is required" },
        { status: 400 },
      );
    }

    // Extract relevant information from LinkedIn data
    const {
      position,
      about,
      experience = [],
      education = [],
      skills = [],
    } = linkedinData;

    // Prepare context for AI analysis
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

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: skillsPrompt }],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "";

    // Parse the JSON response
    let extractedSkills: string[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        extractedSkills = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing AI skills response:", parseError);
      // Fallback: return empty array
      extractedSkills = [];
    }

    // Ensure we have an array of strings
    if (!Array.isArray(extractedSkills)) {
      extractedSkills = [];
    }

    // Filter out any non-string values and clean up
    extractedSkills = extractedSkills
      .filter((skill) => typeof skill === "string" && skill.trim().length > 0)
      .map((skill) => skill.trim())
      .slice(0, 20); // Limit to 20 skills

    return NextResponse.json({
      status: "completed",
      data: {
        skills: extractedSkills,
      },
    });
  } catch (error) {
    console.error("Error extracting skills with AI:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to extract skills with AI" },
      { status: 500 },
    );
  }
}
