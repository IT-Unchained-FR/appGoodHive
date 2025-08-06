export const createPDFToProfilePrompt = (pdfText: string) => {
  return `You are an expert resume parser and professional profile generator. Your task is to analyze the provided resume text and create a comprehensive, professional profile in JSON format.

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
  "description": "Write a long-form, professionally styled personal summary for a Web3-focused job platform profile. The tone should be confident, polished, and written in the first person — as if the user is introducing themselves. The description should include at least 15–20 sentences and reflect the candidate's unique strengths and work history. Use React Quill-compatible formatting with semantic HTML and include emojis in section headings to make it visually engaging. Start with a warm introductory <h2> headline (e.g., 'Hello, I'm [Name]') followed by a paragraph overview of their role and focus area. Create 2–3 themed <h3> sections with short emoji titles based on CV content (e.g., '🚀 What Drives Me', '🌐 Beyond the Code', '🛠️ My Technical Toolbox'). Each section should elaborate on relevant skills, experience, values, achievements, or goals. Include lists or blockquotes where appropriate. End with a short, aspirational closing paragraph that invites recruiters to connect or collaborate.\n\nFormat with proper spacing:\n<h2><strong>Hello, I'm [Name]</strong></h2>\n<p>[Introduction paragraph]</p>\n\n<p>&nbsp;</p>\n\n<h3><strong>🚀 What Drives Me</strong></h3>\n<p>[Content about motivation and goals]</p>\n\n<p>&nbsp;</p>\n\n<h3><strong>🌐 Beyond the Code</strong></h3>\n<p>[Content about soft skills, languages, etc.]</p>\n\n<p>&nbsp;</p>\n\n<h3><strong>🛠️ My Technical Toolbox</strong></h3>\n<p>[Content about technical skills and expertise]</p>",
  "about_work": "Create a well-structured and visually organized 'About my work' section with proper spacing and sectioning:\n\n<h2><strong>Experience</strong></h2>\n<p>&nbsp;</p>\n<p>List each job experience with proper spacing:</p>\n<strong>[Job Title] – [Company]</strong><br>\n[City, Country] | [Start Date] – [End Date]<br>\n[2-3 sentence description of role, achievements, and technologies used]\n\n<p>&nbsp;</p>\n\n<strong>[Next Job Title] – [Company]</strong><br>\n[City, Country] | [Start Date] – [End Date]<br>\n[2-3 sentence description of role, achievements, and technologies used]\n\n<p>&nbsp;</p>\n\n<h2><strong>Key Skills</strong></h2>\n<p>&nbsp;</p>\n<p>Write a comprehensive paragraph highlighting the candidate's key technical and soft skills, emphasizing their expertise in blockchain, Web3, and relevant technologies. Include both hard skills (programming languages, frameworks, tools) and soft skills (leadership, collaboration, problem-solving).</p>\n\n<p>&nbsp;</p>\n\n<h2><strong>Education & Continuous Learning</strong></h2>\n<p>&nbsp;</p>\n<p>List educational background, certifications, and ongoing learning initiatives. Include degrees, relevant certifications, and any blockchain/Web3 specific training.</p>\n\nUse React Quill-compatible HTML formatting with <h2>, <strong>, <em>, <p>, and <br> tags. Add <p>&nbsp;</p> for proper spacing between sections. Keep the tone professional and first-person. Make it between 8-12 sentences total across all sections.",
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
- For description: Create a compelling and detailed professional summary that highlights their top achievements, years of experience, key skills, industries they've worked in, and what sets them apart. The tone should be confident, first-person, and professional (e.g., "I bring over 7 years of experience...", "I specialize in..."). This summary should showcase both technical and strategic abilities, and reflect their professional identity. It should read like a personal introduction for a top-tier online profile or portfolio. Make it rich, engaging, and between **10 to 12 or 15 sentences long based on experience and other things on resume**. Use <strong> tags to make all headings bold and add proper spacing with <p>&nbsp;</p> between sections.
- For about_work: Create a visually organized section with proper spacing. Use <h2><strong> tags for main section headings (Experience, Key Skills, Education & Continuous Learning) to make them bold. Add <p>&nbsp;</p> for spacing between sections and after each job entry. Use <strong> for job titles and <br> for line breaks. Make each section clearly separated and easy to read.
- For experience descriptions: Enhance the job descriptions to sound more professional and impactful.
- For skills: Include both technical skills and soft skills, separated by commas.
- For rate: Suggest a competitive hourly rate based on their experience level and skills.
- If any information is not found in the resume, use reasonable defaults or omit the field.
- Ensure all dates are in YYYY-MM format.
- Make sure the JSON is valid and properly formatted.

Please analyze the resume text and return ONLY the JSON object with no additional text or explanations.
`;
};
