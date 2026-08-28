// Use the direct lib path to avoid pdf-parse loading test files at import time,
// which crashes in Next.js serverless / edge environments.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const PDF_TEXT_EXTRACTOR_URL =
  process.env.PDF_TEXT_EXTRACTOR_URL ??
  "https://pdf-text-extractor-ki7lh2h1i-jubayer-juhans-projects-85b1bbdc.vercel.app/upload-pdf";

const MIN_LOCAL_TEXT_LENGTH = 200;
const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;

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

/** Extracts text from a PDF buffer: local `pdf-parse` first, remote extractor as fallback. */
export const extractPdfText = async (buffer: Buffer, fileName: string) => {
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

/**
 * Fetches a stored CV (e.g. `talents.cv_url`, a public S3 link) and extracts its text.
 * Returns null on any failure — CV extraction is best-effort and must never throw into a caller
 * that has other work (skills, bio) to fall back on.
 */
export const extractCvTextFromUrl = async (cvUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(cvUrl);
    if (!response.ok) {
      console.error(`extractCvTextFromUrl: fetch failed (${response.status}) for ${cvUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) return null;
    if (arrayBuffer.byteLength > MAX_DOWNLOAD_BYTES) {
      console.error(`extractCvTextFromUrl: CV too large (${arrayBuffer.byteLength} bytes) for ${cvUrl}`);
      return null;
    }

    const buffer = Buffer.from(arrayBuffer);
    const fileName = cvUrl.split("/").pop()?.split("?")[0] || "cv.pdf";
    return await extractPdfText(buffer, fileName);
  } catch (error) {
    console.error(`extractCvTextFromUrl: failed for ${cvUrl}:`, error);
    return null;
  }
};
