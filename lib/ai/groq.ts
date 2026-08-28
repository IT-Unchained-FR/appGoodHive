import Groq from "groq-sdk";
import sql from "@/lib/db";

// The previous IDs here (llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768,
// gemma2-9b-it) were all 404/decommissioned on Groq as of Aug 2026 — every call silently failed
// across every Groq-backed feature in the app. Verified live against this account's
// GET /openai/v1/models on 2026-08-28; see docs/features/ai-matching-engine.md for the same
// finding from an earlier audit. Re-verify against that endpoint before assuming these are current.
export const GROQ_MODELS = {
  QWEN_27B: "qwen/qwen3.8-27b",
  QWEN_27B_ALT: "qwen/qwen3.6-27b",
  GPT_OSS_120B: "openai/gpt-oss-120b",
  GPT_OSS_20B: "openai/gpt-oss-20b",
} as const;

export type GroqModelId = (typeof GROQ_MODELS)[keyof typeof GROQ_MODELS];

export const DEFAULT_MODEL_POOL: GroqModelId[] = [
  GROQ_MODELS.QWEN_27B,
  GROQ_MODELS.GPT_OSS_120B,
  GROQ_MODELS.GPT_OSS_20B,
  GROQ_MODELS.QWEN_27B_ALT,
];

export interface GenerateOptions {
  models?: string[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  feature?: string;
}

function logUsage(model: string, feature: string, usage: Groq.CompletionUsage): void {
  sql`
    INSERT INTO goodhive.groq_usage (model, feature, prompt_tokens, completion_tokens, total_tokens)
    VALUES (${model}, ${feature}, ${usage.prompt_tokens}, ${usage.completion_tokens}, ${usage.total_tokens})
  `.catch((err) => console.error("groq: failed to log usage:", err));
}

let roundRobinIndex = 0;

function getRotatedModels(models: string[]): string[] {
  const start = roundRobinIndex++ % models.length;
  return [...models.slice(start), ...models.slice(0, start)];
}

function isRateLimitError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const message = (error as { message?: string })?.message ?? "";
  return status === 429 || message.includes("429") || message.toLowerCase().includes("rate limit");
}

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  // Disable built-in retries — we rotate models ourselves.
  // groq-sdk retries can produce negative setTimeout values when Retry-After contains a past date.
  return new Groq({ apiKey, maxRetries: 0 });
}

/**
 * Generate text with automatic model fallback.
 * Rotates through `models` (default: all 4 Groq models) and returns the first
 * successful response. Throws only when every model has failed.
 */
export async function generateWithFallback(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const { models = DEFAULT_MODEL_POOL, systemPrompt, temperature, maxTokens, feature = "unknown" } = options;

  const client = getGroqClient();
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    { role: "user" as const, content: prompt },
  ];

  const orderedModels = getRotatedModels(models);
  const errors: string[] = [];

  for (const model of orderedModels) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
      });

      const text = completion.choices[0]?.message?.content ?? "";
      if (text) {
        if (completion.usage) logUsage(model, feature, completion.usage);
        return text;
      }

      errors.push(`${model}: empty response`);
    } catch (error) {
      const msg = (error as { message?: string })?.message ?? "unknown error";
      if (isRateLimitError(error)) {
        console.warn(`groq: rate limited on ${model}, rotating to next`);
        errors.push(`${model}: rate limited`);
      } else {
        console.error(`groq: error on ${model}: ${msg}`);
        errors.push(`${model}: ${msg}`);
      }
    }
  }

  throw new Error(`All Groq models failed — ${errors.join(" | ")}`);
}
