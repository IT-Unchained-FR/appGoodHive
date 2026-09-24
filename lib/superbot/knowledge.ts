import sql from "@/lib/ragDb";
import type { RagContext } from "@/lib/ragEngine";

type KnowledgeEntry = {
  title: string;
  body: string;
  category: string;
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

function parseKnowledgeFile(title: string, raw: string): KnowledgeEntry[] {
  const body = raw.replace(/^#\s+.*\n/, "");
  const sections = body.split(/\n##\s+/).map((s) => s.trim()).filter(Boolean);

  return sections.map((section) => {
    const newlineIndex = section.indexOf("\n");
    const sectionTitle = (newlineIndex === -1 ? section : section.slice(0, newlineIndex))
      .replace(/^##\s+/, "")
      .trim();
    const text = (newlineIndex === -1 ? "" : section.slice(newlineIndex + 1)).trim();
    return { title: sectionTitle, body: text, category: title };
  });
}

const CACHE_TTL_MS = 60_000;
let cachedEntries: KnowledgeEntry[] | null = null;
let cachedAt = 0;

async function loadKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  if (cachedEntries && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedEntries;
  }

  try {
    const rows = await sql<{ title: string; content: string }[]>`
      SELECT title, content
      FROM goodhive.knowledge_base_files
      ORDER BY title ASC;
    `;

    const entries: KnowledgeEntry[] = [];
    for (const row of rows) {
      entries.push(...parseKnowledgeFile(row.title, row.content));
    }

    cachedEntries = entries;
    cachedAt = Date.now();
    return entries;
  } catch (error) {
    console.warn("[knowledge-base] Failed to load knowledge_base_files:", error);
    return cachedEntries ?? [];
  }
}

/**
 * Keyword-overlap match against goodhive.knowledge_base_files, editable live
 * from /admin/knowledge-base. Replaces the dead Vertex AI RAG retrieval — no
 * external service, no embeddings; module-scope cache with a short TTL keeps
 * per-message cost low while still picking up admin edits within ~1 minute.
 */
export async function retrieveKnowledgeBaseContexts(
  userMessage: string,
  topK = 4,
): Promise<RagContext[]> {
  const entries = await loadKnowledgeEntries();
  if (entries.length === 0) return [];

  const queryTokens = new Set(tokenize(userMessage));
  if (queryTokens.size === 0) return [];

  const scored = entries
    .map((entry) => {
      const entryTokens = tokenize(`${entry.title} ${entry.body}`);
      let score = 0;
      for (const token of entryTokens) {
        if (queryTokens.has(token)) score += 1;
      }
      return { entry, score };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(({ entry }) => ({
    text: `${entry.title}\n${entry.body}`,
    sourceDisplayName: `GoodHive FAQ — ${entry.category}`,
  }));
}

export async function listKnowledgeQuestions(): Promise<string[]> {
  const entries = await loadKnowledgeEntries();
  return entries.map((entry) => entry.title).filter(Boolean);
}
