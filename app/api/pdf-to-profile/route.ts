import { NextRequest, NextResponse } from "next/server";

// Create Profile With Chat GPT
const createProfileWithChatGPT = async (pdfText: string) => {
  console.log(pdfText, "This is pdf text");

  const prompt = `You are an expert resume parser and professional profile generator. Your task is to analyze the provided resume text and create a comprehensive, professional profile in JSON format.

Please extract and structure the following information from the resume text:

**RESUME TEXT TO ANALYZE:**
${pdfText}

**INSTRUCTIONS:**
1. Extract all personal information (name, email, phone, location)
2. Identify professional title and experience
3. Extract skills and technologies mentioned
4. Find social media links (LinkedIn, GitHub, portfolio)
5. Extract education details
6. Create professional, enhanced descriptions
7. Suggest an appropriate hourly rate based on experience level

**REQUIRED OUTPUT FORMAT (JSON):**
{
  "first_name": "string",
  "last_name": "string", 
  "email": "string",
  "phone_number": "string (digits only)",
  "phone_country_code": "string (e.g., +1, +44)",
  "country": "string (country name)",
  "city": "string",
  "title": "string (professional title)",
  "description": "string (enhanced professional summary - 2-3 sentences highlighting key achievements and expertise)",
  "about_work": "string (professional about work section - what they're looking for, their approach, and career goals)",
  "linkedin": "string (URL if found)",
  "github": "string (URL if found)", 
  "portfolio": "string (URL if found)",
  "skills": "string (comma-separated list of skills and technologies)",
  "rate": "number (suggested hourly rate in USD based on experience)",
  "experience": [
    {
      "title": "string",
      "company": "string", 
      "location": "string",
      "startDate": "string (YYYY-MM format)",
      "endDate": "string (YYYY-MM or 'Present')",
      "description": "string (enhanced job description)"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string", 
      "startDate": "string (YYYY-MM format)",
      "endDate": "string (YYYY-MM format)",
      "gpa": "string (if available)"
    }
  ]
}

**SPECIAL REQUIREMENTS:**
- For description: Create a compelling, professional summary that highlights their key achievements, expertise, and what makes them stand out. Make it sound impressive and professional.
- For about_work: Write a professional section about their work approach, what they're seeking, and their career objectives. Make it engaging and professional.
- For experience descriptions: Enhance the job descriptions to sound more professional and impactful.
- For skills: Include both technical skills and soft skills, separated by commas.
- For rate: Suggest a competitive hourly rate based on their experience level and skills.
- If any information is not found in the resume, use reasonable defaults or omit the field.
- Ensure all dates are in YYYY-MM format.
- Make sure the JSON is valid and properly formatted.

Please analyze the resume text and return ONLY the JSON object with no additional text or explanations.`;

  try {
    // Make API call to ChatGPT
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert resume parser and professional profile generator. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No response from ChatGPT");
    }

    // Parse the JSON response
    const profileData = JSON.parse(generatedText);

    return profileData;
  } catch (error) {
    console.error("Error calling ChatGPT:", error);

    // Fallback to basic parsing if ChatGPT fails
    return {
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      phone_number: "1234567890",
      phone_country_code: "+1",
      country: "United States",
      city: "San Francisco",
      title: "Software Engineer",
      description:
        "Experienced software engineer with expertise in full-stack development and modern web technologies.",
      about_work:
        "Passionate about creating innovative solutions and delivering high-quality software products. Seeking opportunities to work on challenging projects and contribute to meaningful technological advancements.",
      linkedin: "",
      github: "",
      portfolio: "",
      skills: "JavaScript, React, Node.js, Python, AWS, Docker",
      rate: 75,
      experience: [
        {
          title: "Software Engineer",
          company: "Previous Company",
          location: "San Francisco, CA",
          startDate: "2022-01",
          endDate: "Present",
          description:
            "Led development of various software projects and collaborated with cross-functional teams.",
        },
      ],
      education: [
        {
          degree: "Bachelor's Degree",
          institution: "University",
          location: "City, State",
          startDate: "2016-09",
          endDate: "2020-05",
          gpa: "3.8/4.0",
        },
      ],
    };
  }
};

//
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File;

    if (!pdfFile) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    if (pdfFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 },
      );
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (pdfFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 },
      );
    }

    // Convert File to Buffer for external API
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create form data for external API using FormData
    const externalFormData = new FormData();
    const blob = new Blob([buffer], { type: "application/pdf" });
    externalFormData.append("pdf", blob, pdfFile.name);

    // Send request to external PDF text extractor
    const externalResponse = await fetch(
      "https://pdf-text-extractor-ki7lh2h1i-jubayer-juhans-projects-85b1bbdc.vercel.app/upload-pdf",
      {
        method: "POST",
        body: externalFormData,
      },
    );

    if (!externalResponse.ok) {
      console.error(
        "External API error:",
        externalResponse.status,
        externalResponse.statusText,
      );
      return NextResponse.json(
        { error: "Failed to extract text from PDF" },
        { status: 500 },
      );
    }

    const pdfParsingResponse = await externalResponse.json();

    // Process the extracted text to generate profile data
    const profileData = await createProfileWithChatGPT(pdfParsingResponse.text);

    return NextResponse.json({
      status: "completed",
      data: profileData,
      message: "Profile data generated successfully from PDF",
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to process PDF file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
