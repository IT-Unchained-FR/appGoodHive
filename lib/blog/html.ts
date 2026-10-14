import sanitizeHtml from "sanitize-html";

const WORDS_PER_MINUTE = 200;

// sanitize-html instead of isomorphic-dompurify: DOMPurify needs jsdom on the
// server, and jsdom's ESM-only parse5 crashes Vercel functions with
// ERR_REQUIRE_ESM (every article page returned 500 in production).
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "strike",
    "a", "ul", "ol", "li", "blockquote", "pre", "code", "img", "span", "hr",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    // Quill alignment / indent / code-block classes, styled in app/blog/blog.css
    "*": ["class"],
  },
  allowedClasses: { "*": ["ql-align-*", "ql-indent-*", "ql-syntax"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer" } : attribs,
    }),
  },
};

/** Strips anything unsafe from editor HTML. Run on save and again on render. */
export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html || "", SANITIZE_OPTIONS);
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
