import DOMPurify from "isomorphic-dompurify";

const WORDS_PER_MINUTE = 200;

const SANITIZE_CONFIG: DOMPurify.Config = {
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
  ADD_ATTR: ["target", "rel"],
};

/** Strips anything unsafe from editor HTML. Run on save and again on render. */
export function sanitizeBlogHtml(html: string): string {
  return DOMPurify.sanitize(html || "", SANITIZE_CONFIG) as string;
}

export function htmlToPlainText(html: string): string {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(html: string): number {
  const text = htmlToPlainText(html);
  return text ? text.split(" ").length : 0;
}

export function readingMinutesFromWords(words: number): number {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** First ~maxLength characters of the article, cut at a word boundary. */
export function excerptFromHtml(html: string, maxLength = 200): string {
  const text = htmlToPlainText(html);
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trim()}…`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
