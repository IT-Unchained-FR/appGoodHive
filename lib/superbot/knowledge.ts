import sql from "@/lib/ragDb";
import type { RagContext } from "@/lib/ragEngine";

type ContentItemRow = {
  id: string;
  title: string;
  body: string;
};

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "did", "to", "of", "in", "on",
  "for", "and", "or", "how", "what", "when", "where", "why", "who", "which",
  "i", "you", "your", "my", "me", "can", "could", "would", "should", "will",
  "it", "this", "that", "with", "about", "need", "want", "get", "have", "has",
  "be", "as", "if", "not", "no", "yes", "please", "tell", "explain", "goodhive",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

let cachedItems: ContentItemRow[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadActiveFaqItems(): Promise<ContentItemRow[]> {
  const now = Date.now();
  if (cachedItems && now - cachedAt < CACHE_TTL_MS) {
    return cachedItems;
  }
  const rows = await sql<ContentItemRow[]>`
    SELECT id, title, body
    FROM goodhive.content_items
    WHERE type = 'faq' AND status = 'active';
  `;
  cachedItems = rows;
  cachedAt = now;
  return rows;
}

/**
 * Keyword-overlap match against goodhive.content_items (type='faq').
 * Replaces the dead Vertex AI RAG retrieval — no external service, no embeddings.
 */
export async function retrieveKnowledgeBaseContexts(
  userMessage: string,
  topK = 4,
): Promise<RagContext[]> {
  const items = await loadActiveFaqItems();
  if (items.length === 0) return [];

  const queryTokens = new Set(tokenize(userMessage));
  if (queryTokens.size === 0) return [];

  const scored = items
    .map((item) => {
      const itemTokens = tokenize(`${item.title} ${item.body}`);
      let score = 0;
      for (const token of itemTokens) {
        if (queryTokens.has(token)) score += 1;
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(({ item }) => ({
    text: `${item.title}\n${item.body}`,
    sourceDisplayName: "GoodHive FAQ",
  }));
}
