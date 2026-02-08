import sql from "@/lib/ragDb";
import { logSuperbotEvent } from "./events";

const DEFAULT_VARIANTS = ["A", "B"] as const;

type SessionFields = Record<string, unknown> | null;

type ChatSession = {
  id: string;
  fields?: SessionFields;
};

function normalizeVariants(value?: string | null) {
  if (!value) return [...DEFAULT_VARIANTS];
  const parsed = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : [...DEFAULT_VARIANTS];
}

function pickVariant(variants: string[]) {
  const index = Math.floor(Math.random() * variants.length);
  return variants[index] ?? variants[0];
}

function parseFields(value: unknown): SessionFields {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as SessionFields;
    } catch {
      return null;
    }
  }
  return value as SessionFields;
}

export function isCtaExperimentEnabled() {
  return (process.env.SUPERBOT_CTA_EXPERIMENT_ENABLED ?? "true") !== "false";
}

export async function getCtaExperimentVariant(session: ChatSession) {
  if (!isCtaExperimentEnabled()) return "A";

  const fields = parseFields(session.fields) ?? {};
  const experiments = (fields.experiments as Record<string, unknown> | null) ?? {};
  const existing = experiments.ctaVariant;

  if (typeof existing === "string" && existing) {
    return existing;
  }

  const variants = normalizeVariants(process.env.SUPERBOT_CTA_VARIANTS);
  const selected = pickVariant(variants);

  const nextFields = {
    ...fields,
    experiments: {
      ...experiments,
      ctaVariant: selected,
    },
  };

  await sql`
    UPDATE goodhive.chat_sessions
    SET fields = ${JSON.stringify(nextFields)}, updated_at = NOW()
    WHERE id = ${session.id};
  `;

  await logSuperbotEvent({
    sessionId: session.id,
    type: "experiment_assigned",
    metadata: {
      experiment: "cta_variant",
      variant: selected,
    },
  });

  return selected;
}
