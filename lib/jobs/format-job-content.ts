import { IJobSection } from "@/interfaces/job-offer";
import { getGeminiModel } from "@/lib/gemini";

const MODEL_NAME =
  process.env.GEMINI_CHAT_MODEL ??
  process.env.GEMINI_FAST_MODEL ??
  "gemini-2.0-flash";

const STRUCTURED_HTML_PATTERN = /<(p|ul|ol|li|h2|h3|h4|blockquote|br)\b/i;
const URL_PATTERN = /(https?:\/\/[^\s<]+)/gi;
const BULLET_PATTERN =
  /^([*\-•]|(?:\d+[).])|(?:[A-Z][a-z]+:))/;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkifyPlainText(value: string) {
  return value.replace(URL_PATTERN, (match) => {
    const escapedUrl = escapeHtml(match);
    return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedUrl}</a>`;
  });
}

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function sanitizeHeading(value: string, fallback: string) {
  const trimmed = normalizeWhitespace(value).replace(/\s+/g, " ");
  return trimmed || fallback;
}

export function hasStructuredHtml(value: string | null | undefined) {
  return STRUCTURED_HTML_PATTERN.test(value || "");
}

export function plainTextToStructuredHtml(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value || "");
  if (!normalized) {
    return "";
  }

  const chunks = normalized
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    return "";
  }

  const htmlBlocks: string[] = [];

  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      continue;
    }

    const looksLikeList =
      lines.length > 1 && lines.every((line) => BULLET_PATTERN.test(line));

    if (looksLikeList) {
      const items = lines
        .map((line) => line.replace(BULLET_PATTERN, "").trim())
        .filter(Boolean)
        .map((line) => `<li>${linkifyPlainText(escapeHtml(line))}</li>`)
        .join("");

      if (items) {
        htmlBlocks.push(`<ul>${items}</ul>`);
      }
      continue;
    }

    const paragraph = lines
      .map((line) => linkifyPlainText(escapeHtml(line)))
      .join("<br />");

    if (paragraph) {
      htmlBlocks.push(`<p>${paragraph}</p>`);
    }
  }

  return htmlBlocks.join("");
}

function extractGeminiText(result: unknown) {
  const response = result as {
    response?: {
      text?: () => string;
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
  };

  if (typeof response?.response?.text === "function") {
    return response.response.text();
  }

  return response?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function formatSectionsWithGemini(
  sections: IJobSection[],
  jobTitle?: string,
) {
  const prompt = `You are a formatting assistant for GoodHive job postings.

Your task is to clean up messy job section text while preserving the original meaning exactly.

Rules:
- Do not invent new requirements, benefits, responsibilities, budgets, or facts.
- Keep the same section count and the same overall intent.
- Improve continuity and readability across sections.
- Return professional HTML using ONLY these tags: <p>, <ul>, <ol>, <li>, <strong>, <em>, <br>, <a>.
- Use short paragraphs and lists where appropriate.
- Keep links clickable if URLs are present.
- Do not wrap content in markdown code fences.

Job title: ${jobTitle || "Untitled GoodHive job"}

Input sections:
${JSON.stringify(
  sections.map((section, index) => ({
    heading: section.heading,
    content: normalizeWhitespace(section.content),
    sort_order:
      typeof section.sort_order === "number" ? section.sort_order : index,
  })),
)}

Return ONLY valid JSON:
{
  "sections": [
    {
      "heading": "Section heading",
      "content": "<p>Formatted HTML content</p>",
      "sort_order": 0
    }
  ]
}`;

  const model = getGeminiModel(MODEL_NAME);
  const result = await model.generateContent(prompt);
  const rawText = extractGeminiText(result)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(rawText) as { sections?: Array<Partial<IJobSection>> };
  if (!Array.isArray(parsed.sections) || parsed.sections.length !== sections.length) {
    throw new Error("Gemini returned an invalid job sections payload");
  }

  return parsed.sections.map((section, index) => ({
    heading: sanitizeHeading(
      typeof section.heading === "string" ? section.heading : "",
      sections[index].heading || `Section ${index + 1}`,
    ),
    content:
      typeof section.content === "string" && section.content.trim()
        ? section.content.trim()
        : plainTextToStructuredHtml(sections[index].content),
    sort_order:
      typeof section.sort_order === "number" ? section.sort_order : index,
  }));
}

export async function normalizeJobSectionsForStorage(
  sections: IJobSection[],
  jobTitle?: string,
) {
  const normalizedSections = sections
    .map((section, index) => ({
      heading: sanitizeHeading(section.heading, `Section ${index + 1}`),
      content: normalizeWhitespace(section.content),
      sort_order:
        typeof section.sort_order === "number" ? section.sort_order : index,
    }))
    .filter((section) => section.heading && section.content);

  if (normalizedSections.length === 0) {
    return {
      descriptionHtml: "",
      sections: [] as IJobSection[],
    };
  }

  const fallbackSections = normalizedSections.map((section) => ({
    ...section,
    content: hasStructuredHtml(section.content)
      ? section.content
      : plainTextToStructuredHtml(section.content),
  }));

  const shouldUseGemini = normalizedSections.some(
    (section) => !hasStructuredHtml(section.content),
  );

  const formattedSections = shouldUseGemini
    ? await formatSectionsWithGemini(normalizedSections, jobTitle).catch(
        () => fallbackSections,
      )
    : fallbackSections;

  return {
    descriptionHtml: formattedSections
      .map(
        (section) =>
          `<h3>${escapeHtml(section.heading)}</h3>${section.content.trim()}`,
      )
      .join(""),
    sections: formattedSections,
  };
}

export function normalizeJobDescriptionForDisplay(
  value: string | null | undefined,
) {
  const normalized = normalizeWhitespace(value || "");
  if (!normalized) {
    return "";
  }

  return hasStructuredHtml(normalized)
    ? normalized
    : plainTextToStructuredHtml(normalized);
}
