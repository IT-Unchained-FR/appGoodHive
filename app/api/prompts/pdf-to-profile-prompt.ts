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
  "description": "string (enhanced professional summary - 4-6 sentences highlighting key achievements and expertise, written in first person as if the person is introducing themselves)",
  "about_work": "string (professional about work section - 4-6 sentences about what they're looking for, their approach, and career goals, written in first person as if the person is introducing themselves)",
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
- For description: Create a compelling and detailed professional summary that highlights their top achievements, years of experience, key skills, industries they've worked in, and what sets them apart. The tone should be confident, first-person, and professional (e.g., "I bring over 7 years of experience...", "I specialize in..."). This summary should showcase both technical and strategic abilities, and reflect their professional identity. It should read like a personal introduction for a top-tier online profile or portfolio. Make it rich, engaging, and between **10 to 12 or 15 sentences long based on experience and other things on resume**.
- For about_work: Write a structured, thoughtful section about the person's work philosophy, preferred types of projects or companies, team collaboration style, and future career goals. Highlight how they approach problem-solving, learning, or leadership if applicable. This section should give hiring managers a sense of what it's like to work with the candidate. Keep the tone first-person, professional, and engaging (e.g., "I thrive in fast-paced, collaborative environments...", "I am seeking opportunities where I can..."). Make it between **6 to 10 sentences long**, and emphasize authenticity, clarity, and ambition.
- For experience descriptions: Enhance the job descriptions to sound more professional and impactful.
- For skills: Include both technical skills and soft skills, separated by commas.
- For rate: Suggest a competitive hourly rate based on their experience level and skills.
- If any information is not found in the resume, use reasonable defaults or omit the field.
- Ensure all dates are in YYYY-MM format.
- Make sure the JSON is valid and properly formatted.

Please analyze the resume text and return ONLY the JSON object with no additional text or explanations.`;
};
