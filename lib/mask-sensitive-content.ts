/**
 * Masking helpers for confidential names inside free text.
 *
 * Job titles, job descriptions and company stories are written by companies
 * and routinely mention the company name ("Senior Engineer – Acme",
 * "Acme is hiring…"). Hiding the name field alone is not enough: for
 * viewers who are not entitled to see a company's identity, the name has to
 * be scrubbed out of that text as well. These helpers do the scrubbing —
 * they are pure string functions, safe to use in server and client
 * components alike.
 *
 * The masking mirrors ProfileAboutWork's treatment of talent bios: links
 * are unwrapped so their URLs never render, and email addresses, phone
 * numbers, social-profile URLs and the given name terms are replaced with
 * a placeholder in the visible text.
 */

const MASK_PLACEHOLDER = "•••";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const CONTACT_DOMAIN_PATTERN =
  /\b(?:https?:\/\/|www\.)?(?:linkedin\.com|github\.com|gitlab\.com|twitter\.com|x\.com|t\.me|telegram\.me|facebook\.com|instagram\.com|stackoverflow\.com)(?:\/[^\s<]*)?/gi;

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

const PHONE_PATTERN = /\+?\d[\d\s().-]{6,}\d/g;

/**
 * Words that appear in many company names but carry no identifying power on
 * their own — including the industry vocabulary of this marketplace, where
 * scrubbing "Web3" or "Blockchain" out of every job text would mangle
 * content that has nothing to do with the company's identity.
 */
const GENERIC_NAME_WORDS = new Set([
  "ai",
  "app",
  "apps",
  "blockchain",
  "bv",
  "capital",
  "cloud",
  "company",
  "consulting",
  "corp",
  "corporation",
  "crypto",
  "data",
  "defi",
  "digital",
  "enterprise",
  "enterprises",
  "global",
  "gmbh",
  "group",
  "holding",
  "holdings",
  "inc",
  "industries",
  "international",
  "lab",
  "labs",
  "llc",
  "ltd",
  "media",
  "network",
  "networks",
  "partner",
  "partners",
  "sas",
  "service",
  "services",
  "software",
  "solution",
  "solutions",
  "studio",
  "studios",
  "system",
  "systems",
  "tech",
  "technologies",
  "technology",
  "venture",
  "ventures",
  "web3",
  "works",
]);

/**
 * Build the list of strings to scrub for a display name: the full name plus
 * each distinctive word in it (length >= 4, not a generic word), so a text
 * that uses only "Merkl" is caught even when the full name is
 * "Merkl SAS".
 */
export function sensitiveNameTerms(name?: string | null): string[] {
  const fullName = name?.trim();
  if (!fullName) {
    return [];
  }

  const words = fullName
    .split(/[^A-Za-z0-9À-ÿ]+/)
    .filter(
      (word) =>
        word.length >= 4 && !GENERIC_NAME_WORDS.has(word.toLowerCase()),
    );

  return Array.from(new Set([fullName, ...words]));
}

function maskTextSegment(text: string, terms: string[]): string {
  let result = text;

  for (const term of terms) {
    result = result.replace(
      new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"),
      MASK_PLACEHOLDER,
    );
  }

  result = result.replace(EMAIL_PATTERN, MASK_PLACEHOLDER);
  result = result.replace(CONTACT_DOMAIN_PATTERN, MASK_PLACEHOLDER);
  result = result.replace(PHONE_PATTERN, MASK_PLACEHOLDER);
  return result;
}

/** Mask a plain-text string (job title, heading, preview text…). */
export function maskSensitiveText(
  text: string,
  terms: string[],
): string {
  if (!text) {
    return text;
  }
  return maskTextSegment(text, terms);
}

/**
 * Mask an HTML string: anchor tags are dropped (their link text survives as
 * plain text, the URL never renders) and the text replacements only touch
 * visible text between tags.
 */
export function maskSensitiveHtml(
  html: string,
  terms: string[],
): string {
  if (!html) {
    return html;
  }

  return html
    .split(/(<[^>]+>)/g)
    .map((segment) => {
      if (segment.startsWith("<")) {
        return /^<\/?a(?:\s|>)/i.test(segment) ? "" : segment;
      }
      return maskTextSegment(segment, terms);
    })
    .join("");
}
