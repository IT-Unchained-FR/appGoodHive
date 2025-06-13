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

    console.log("educations", educations);
    console.log("position", position);

    // Extract skills names
    const skillNames = skills.map((skill: any) => skill.name || "").join(", ");

    const formattedEducations = educations
      .map((edu: any) => {
        const startYear = edu.start?.year || "N/A";
        const endYear = edu.end?.year || "Present";
        return `${edu.degree} in ${edu.fieldOfStudy} from ${edu.schoolName} (${startYear} - ${endYear})`;
      })
      .join("; ");

    const formattedExperiences = position
      .map((pos: any) => {
        const startYear = pos.start?.year || "N/A";
        const endYear = pos.end?.year === 0 ? "Present" : pos.end?.year;
        return `${pos.title} at ${pos.companyName} (${startYear} - ${endYear}), ${pos.location}`;
      })
      .join("; ");

    // Construct the prompts
    const titlePrompt = `
    You are an expert professional profile writer. 
    Create a compelling and professional profile headline for a talent in the tech industry.
    Use the following information:
    - Current headline: "${headline || "N/A"}"
    - Skills: ${skillNames}
    - Experience: ${formattedExperiences}
    
    Keep it concise (under 50-60 characters), professional, and impactful.
    Include their primary expertise and what makes them stand out.
    Format: Just return the headline text with no quotation marks or additional formatting.
    `;

    const descriptionPrompt = `
    You are an expert professional profile writer.
    Create a compelling professional summary/description for a talent profile using the following information:
    - Name: ${firstName} ${lastName}
    - Current headline: "${headline || "N/A"}"
    - Current summary: "${summary || "N/A"}"
    - Skills: ${skillNames}
    - Experience: ${formattedExperiences}
    
    Write a captivating description (200-300 words) highlighting their expertise, achievements, and unique value proposition.
    And also make sure it's been written in the language of the user (in the language of the user like user is talking to the audience).
    Use professional, confident language. Format in HTML paragraphs (<p>...</p>).
    Focus on what makes them exceptional and the value they bring to potential employers or clients.
    IMPORTANT: Do not include any markdown formatting or code blocks in your response.
    `;

    const aboutWorkPrompt = `
    You are an expert professional profile writer.
    
    Create a compelling "About My Work" section for a talent profile using the following information:
    - Name: ${firstName} ${lastName}
    - Current headline: "${headline || "N/A"}"
    - Current summary: "${summary || "N/A"}"
    - Skills: ${skillNames}
    - Experience: ${formattedExperiences}
    - Education: ${formattedEducations || "N/A"}
    
    Your task is to write a professional, well-structured "About My Work" section (300–400 words) that includes the following clearly separated parts, formatted using <p> tags for paragraphs and <strong> or <h4> tags for section headings:
    
    1. <h2>Work Philosophy & Approach</h2>
       - Describe their work ethics, how they approach tasks, commitment to quality, client collaboration style, and what makes them dependable.
    
    2. <h2>Key Skills</h2>
       - Highlight their core competencies and technical or creative strengths. Include soft skills if applicable.
    
    3. <h2>Professional Experience</h2>
       - Summarize major roles, industries worked in, and achievements or results they've delivered.
    
    4. <h2>Education & Continuous Learning</h2>
       - Mention their academic background and any certifications or ongoing learning habits that support their expertise.
    
    5. <h2>What Clients Can Expect</h2>
       - Communicate what clients will experience when working with this person: clarity, responsiveness, innovation, delivery, etc.
    
    Guidelines:
    - To Mention My Name Please Use me so that it's easy to understand and user can understand that it's about me and I wrote it.
    - Please make it rich text so I can enter this on the rich text editor.
    - Make the header in bold and the text in normal and after each section add a line break and some space under the section.
    - Use confident and polished language suitable for professional client profiles.
    - DO NOT repeat the summary content — this is focused specifically on their work habits, professionalism, and how they deliver value.
    - Ensure the text is written in the user's language if provided.
    - Do NOT use any markdown or code blocks in the response. Use HTML formatting only as directed above.
    `;

    // Generate all content in parallel
    const [titleResponse, descriptionResponse, aboutWorkResponse] =
      await Promise.all([
        openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: titlePrompt }],
          temperature: 0.7,
        }),
        openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: descriptionPrompt }],
          temperature: 0.7,
        }),
        openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: aboutWorkPrompt }],
          temperature: 0.7,
        }),
      ]);

    return NextResponse.json({
      status: "completed",
      data: {
        title: titleResponse.choices[0]?.message?.content || "",
        description: descriptionResponse.choices[0]?.message?.content || "",
        aboutWork: aboutWorkResponse.choices[0]?.message?.content || "",
      },
    });
  } catch (error) {
    console.error("Error enhancing content with AI:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to enhance content with AI" },
      { status: 500 },
    );
  }
}
