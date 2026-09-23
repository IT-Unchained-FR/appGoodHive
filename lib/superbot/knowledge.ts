import fs from "fs";
import path from "path";
import type { RagContext } from "@/lib/ragEngine";

type KnowledgeEntry = {
  title: string;
  body: string;
  category: string;
};

// Listed literally (not via readdirSync) so Next.js's file tracing bundles
// them into the standalone serverless output.
const KNOWLEDGE_FILES = [
  "general.md",
  "getting-started.md",
  "pricing.md",
  "jobs.md",
  "technical.md",
  "payments.md",
  "security.md",
  "support.md",
] as const;

const KNOWLEDGE_DIR = path.join(process.cwd(), "content", "superbot-knowledge");

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

function parseKnowledgeFile(fileName: string, raw: string): KnowledgeEntry[] {
  const lines = raw.split("\n");
  const categoryLine = lines.find((line) => line.startsWith("# "));
  const category = categoryLine ? categoryLine.replace(/^#\s+/, "").trim() : fileName;

  const body = raw.replace(/^#\s+.*\n/, "");
  const sections = body.split(/\n##\s+/).map((s) => s.trim()).filter(Boolean);

  return sections.map((section) => {
    const newlineIndex = section.indexOf("\n");
    const title = (newlineIndex === -1 ? section : section.slice(0, newlineIndex))
      .replace(/^##\s+/, "")
      .trim();
    const text = (newlineIndex === -1 ? "" : section.slice(newlineIndex + 1)).trim();
    return { title, body: text, category };
  });
}

let cachedEntries: KnowledgeEntry[] | null = null;

function loadKnowledgeEntries(): KnowledgeEntry[] {
  if (cachedEntries) return cachedEntries;

  const entries: KnowledgeEntry[] = [];
  for (const fileName of KNOWLEDGE_FILES) {
    try {
      const raw = fs.readFileSync(path.join(KNOWLEDGE_DIR, fileName), "utf-8");
      entries.push(...parseKnowledgeFile(fileName, raw));
    } catch (error) {
      console.warn(`[knowledge-base] Failed to read ${fileName}:`, error);
    }
  }
  cachedEntries = entries;
  return entries;
}

/**
 * Keyword-overlap match against the markdown knowledge base in
 * content/superbot-knowledge/*.md. Replaces the dead Vertex AI RAG
 * retrieval — no external service, no database, no embeddings.
 */
export async function retrieveKnowledgeBaseContexts(
  userMessage: string,
  topK = 4,
): Promise<RagContext[]> {
  const entries = loadKnowledgeEntries();
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
  return loadKnowledgeEntries().map((entry) => entry.title).filter(Boolean);
}
