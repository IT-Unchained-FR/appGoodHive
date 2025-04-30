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
      firstName,
      lastName,
      headline,
      summary,
      skills = [],
      position = [],
      educations = [],
    } = linkedinData;

    // Extract skills names
    const skillNames = skills.map((skill: any) => skill.name || "").join(", ");

    // Extract positions/experience
    const experiences = position
      .map(
        (exp: any) =>
          `${exp.title} at ${exp.company}${exp.description ? `: ${exp.description}` : ""}`,
      )
      .join("\n");

    // Construct the prompt for title/headline
    const titlePrompt = `
    You are an expert professional profile writer. 
    Create a compelling and professional profile headline for a talent in the tech industry.
    Use the following information:
    - Current headline: "${headline || "N/A"}"
    - Skills: ${skillNames}
    - Experience: ${experiences}
    
    Keep it concise (under 50-60 characters), professional, and impactful.
    Include their primary expertise and what makes them stand out.
    Format: Just return the headline text with no quotation marks or additional formatting.
    `;

    // Construct the prompt for description
    const descriptionPrompt = `
    You are an expert professional profile writer.
    Create a compelling professional summary/description for a talent profile using the following information:
    - Name: ${firstName} ${lastName}
    - Current headline: "${headline || "N/A"}"
    - Current summary: "${summary || "N/A"}"
    - Skills: ${skillNames}
    - Experience: ${experiences}
    
    Write a captivating description (200-300 words) highlighting their expertise, achievements, and unique value proposition.
    And also make sure it's been written in the language of the user (in the language of the user like user is talking to the audience).
    Use professional, confident language. Format in HTML paragraphs (<p>...</p>).
    Focus on what makes them exceptional and the value they bring to potential employers or clients.
    IMPORTANT: Do not include any markdown formatting or code blocks in your response.
    `;

    // Construct the prompt for about work
    const aboutWorkPrompt = `
    You are an expert professional profile writer.
    Create a compelling "About My Work" section for a talent profile using the following information:
    - Name: ${firstName} ${lastName}
    - Current headline: "${headline || "N/A"}"
    - Current summary: "${summary || "N/A"}"
    - Skills: ${skillNames}
    - Experience: ${experiences}
    
    Write a professional section (150-250 words) detailing their work approach, methodology, and what clients can expect.
    Include their work ethics, collaboration style, and any unique aspects of their work process.
    Use professional, confident language. Format in HTML paragraphs (<p>...</p>).
    And also make sure it's been written in the language of the user. And make it different from the summary because it's about work and we will tell more about how I handle work in the summary.
    IMPORTANT: Do not include any markdown formatting or code blocks in your response.
    `;

    // Make parallel API calls to OpenAI for each section
    const [titleResponse, descriptionResponse, aboutWorkResponse] =
      await Promise.all([
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: titlePrompt }],
          temperature: 0.7,
        }),
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: descriptionPrompt }],
          temperature: 0.7,
        }),
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: aboutWorkPrompt }],
          temperature: 0.7,
        }),
      ]);

    // Extract the generated content
    const enhancedTitle =
      titleResponse.choices[0]?.message.content?.trim() || "";
    const enhancedDescription =
      descriptionResponse.choices[0]?.message.content?.trim() || "";
    const enhancedAboutWork =
      aboutWorkResponse.choices[0]?.message.content?.trim() || "";

    return NextResponse.json({
      title: enhancedTitle,
      description: enhancedDescription,
      aboutWork: enhancedAboutWork,
    });
  } catch (error) {
    console.error("Error enhancing content with AI:", error);
    return NextResponse.json(
      { message: "Failed to enhance content with AI" },
      { status: 500 },
    );
  }
}
