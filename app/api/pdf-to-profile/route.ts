import { NextRequest, NextResponse } from "next/server";
// Use the direct lib path to avoid pdf-parse loading test files at import time,
// which crashes in Next.js serverless / edge environments.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import {
  chunkTextForAI,
  extractJsonObject,
  mergeExtractedResumeFacts,
  type ExtractedResumeFacts,
  normalizeExtractedResumeFacts,
} from "./pdf-import-utils";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const PDF_TEXT_EXTRACTOR_URL =
  process.env.PDF_TEXT_EXTRACTOR_URL ??
  "https://pdf-text-extractor-ki7lh2h1i-jubayer-juhans-projects-85b1bbdc.vercel.app/upload-pdf";

const MAX_SIZE = 10 * 1024 * 1024;
const MIN_LOCAL_TEXT_LENGTH = 200;

const EXTRACTION_SYSTEM_PROMPT = `
You extract facts from one chunk of resume text.
Return valid JSON only.
Do not invent details that are not supported by the text.
Normalize dates to YYYY-MM when possible.
Keep lists comprehensive and avoid duplicates inside the same response.
`;

const createChunkExtractionPrompt = (
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
) => `
Resume chunk ${chunkIndex} of ${totalChunks}

Extract all supported facts from this resume chunk and return a JSON object with this exact shape:
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "phone_number": "string",
  "phone_country_code": "string",
  "country": "string",
  "city": "string",
  "title": "string",
  "linkedin": "string",
  "github": "string",
  "portfolio": "string",
  "skills": ["string"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "description": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "location": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "gpa": "string",
      "description": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM",
      "description": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": "string",
      "url": "string"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "string"
    }
  ]
}

Rules:
- If a field is not present, use an empty string, empty array, or omit numeric values.
- Preserve all meaningful details from the chunk.
- Skills must be an array of strings.
- Do not write markdown or commentary.

Resume text:
${chunkText}
`;

const NARRATIVE_SYSTEM_PROMPT = `
You turn structured resume facts into polished profile content.
Return valid JSON only.
Do not remove facts from the provided data.
Keep the HTML compatible with React Quill.
`;

const createNarrativePrompt = (facts: ExtractedResumeFacts) => `
Use this structured resume data to produce polished profile copy.
Return JSON with this exact shape:
{
  "title": "string",
  "description": "string",
  "about_work": "string"
}

Rules:
- Keep title concise and specific.
- "description" must be a strong public bio in HTML with semantic headings and paragraphs.
- "about_work" must be a detailed work-focused HTML section covering experience, strengths, projects, and working style.
- Preserve the candidate's factual background from the data below.
- Do not include markdown fences.

Structured resume data:
${JSON.stringify(facts, null, 2)}
`;

const callOpenAIForJson = async <T,>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
) => {
  if (!OPENAI_API_KEY) {
    throw new Error("Server misconfiguration: OPENAI_API_KEY is missing");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const generatedText = data.choices?.[0]?.message?.content;

  if (!generatedText) {
    throw new Error("No response from OpenAI");
  }

  return extractJsonObject<T>(generatedText);
};

const extractTextLocally = async (buffer: Buffer) => {
  try {
    const parsedPdf = await pdfParse(buffer);
    const extractedText = parsedPdf.text?.trim() || "";

    if (extractedText.length >= MIN_LOCAL_TEXT_LENGTH) {
      return extractedText;
    }
  } catch (error) {
    console.error("Local PDF parsing failed:", error);
  }

  return "";
};

const extractTextWithFallbackService = async (buffer: Buffer, fileName: string) => {
  const externalFormData = new FormData();
  const blob = new Blob([buffer], { type: "application/pdf" });
  externalFormData.append("pdf", blob, fileName);

  const externalResponse = await fetch(PDF_TEXT_EXTRACTOR_URL, {
    method: "POST",
    body: externalFormData,
  });

  if (!externalResponse.ok) {
    throw new Error(
      `Failed to extract text from PDF (status ${externalResponse.status})`,
    );
  }

  const pdfParsingResponse = await externalResponse.json();
  return pdfParsingResponse?.text?.trim() || "";
};

const extractPdfText = async (buffer: Buffer, fileName: string) => {
  const localText = await extractTextLocally(buffer);
  if (localText) {
    return localText;
  }

  const fallbackText = await extractTextWithFallbackService(buffer, fileName);
  if (fallbackText) {
    return fallbackText;
  }

  throw new Error("Unable to extract readable text from the PDF");
};

const hasMeaningfulFacts = (facts: ExtractedResumeFacts) =>
  Boolean(
    facts.first_name ||
      facts.last_name ||
      facts.email ||
      facts.title ||
      facts.skills?.length ||
      facts.experience?.length ||
      facts.education?.length ||
      facts.certifications?.length ||
      facts.projects?.length,
  );

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

    if (pdfFile.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    if (pdfFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 },
      );
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfText = await extractPdfText(buffer, pdfFile.name);

    const chunks = chunkTextForAI(pdfText);
    if (!chunks.length) {
      return NextResponse.json(
        { error: "No readable text could be extracted from this PDF" },
        { status: 422 },
      );
    }

    const extractedChunks: ExtractedResumeFacts[] = [];

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const extractedChunk = await callOpenAIForJson<Record<string, unknown>>(
        EXTRACTION_SYSTEM_PROMPT,
        createChunkExtractionPrompt(chunk, index + 1, chunks.length),
        2200,
      );
      extractedChunks.push(normalizeExtractedResumeFacts(extractedChunk));
    }

    const mergedFacts = mergeExtractedResumeFacts(extractedChunks);

    if (!hasMeaningfulFacts(mergedFacts)) {
      return NextResponse.json(
        { error: "We could not extract enough structured data from this PDF" },
        { status: 422 },
      );
    }

    const generatedNarrative = await callOpenAIForJson<{
      title?: string;
      description?: string;
      about_work?: string;
    }>(NARRATIVE_SYSTEM_PROMPT, createNarrativePrompt(mergedFacts), 2600);

    const finalProfileData = {
      first_name: mergedFacts.first_name || "",
      last_name: mergedFacts.last_name || "",
      email: mergedFacts.email || "",
      phone_number: mergedFacts.phone_number || "",
      phone_country_code: mergedFacts.phone_country_code || "",
      country: mergedFacts.country || "",
      city: mergedFacts.city || "",
      title:
        generatedNarrative.title ||
        mergedFacts.title ||
        mergedFacts.experience?.[0]?.title ||
        "",
      description: generatedNarrative.description || "",
      about_work: generatedNarrative.about_work || "",
      linkedin: mergedFacts.linkedin || "",
      github: mergedFacts.github || "",
      portfolio: mergedFacts.portfolio || "",
      skills: (mergedFacts.skills || []).join(", "),
      experience: mergedFacts.experience || [],
      education: mergedFacts.education || [],
      certifications: mergedFacts.certifications || [],
      projects: mergedFacts.projects || [],
      languages: mergedFacts.languages || [],
    };

    return NextResponse.json({
      status: "completed",
      data: finalProfileData,
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
