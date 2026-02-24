import sql from "@/lib/ragDb";
import { logSuperbotEvent } from "./events";
import { notifyHandoff } from "./notifications";

export type LeadType = "talent" | "company";

type LeadScoreSignals = {
  hasPortfolio: boolean;
  matchesPriorityRole: boolean;
  availabilitySoon: boolean;
  experience3Plus: boolean;
  askedAboutPayOrRoles: boolean;
  wantsHumanHelp: boolean;
};

type LeadScoreResult = {
  score: number;
  signals: LeadScoreSignals;
};

const DEFAULT_PRIORITY_ROLES = [
  "full stack",
  "fullstack",
  "frontend",
  "backend",
  "react",
  "node",
  "typescript",
  "python",
  "go",
  "devops",
  "data",
  "ml",
  "ai",
];

const PAY_ROLE_KEYWORDS = [
  "salary",
  "compensation",
  "pay",
  "rate",
  "budget",
  "pricing",
  "price",
  "cost",
  "roles",
  "openings",
  "positions",
];

const HUMAN_HELP_KEYWORDS = [
  "human",
  "agent",
  "representative",
  "talk to",
  "call me",
  "book a call",
  "schedule a call",
  "support",
];

const AVAILABILITY_KEYWORDS = [
  "now",
  "immediately",
  "asap",
  "today",
  "this week",
  "next week",
  "soon",
  "available",
  "immediate",
  "right away",
  "2 weeks",
  "two weeks",
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function parseExperienceYears(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") return null;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasPortfolioLink(value: string) {
  return /(https?:\/\/\S+)|(\bgithub\.com\/\S+)|(\blinkedin\.com\/\S+)/i.test(value);
}

function getPriorityRoleKeywords() {
  const envValue = process.env.GOODHIVE_PRIORITY_ROLES;
  if (!envValue) return DEFAULT_PRIORITY_ROLES;
  return envValue
    .split(",")
    .map((entry) => normalizeText(entry))
    .filter(Boolean);
}

function computeLeadScore(input: {
  type: LeadType;
  fields: Record<string, unknown>;
  lastUserMessage?: string | null;
}): LeadScoreResult {
  const fields = input.fields ?? {};
  const message = normalizeText(input.lastUserMessage ?? "");

  const roleTextRaw = `${fields.role ?? ""} ${fields.roleNeeded ?? ""}`;
  const roleText = normalizeText(roleTextRaw);

  const availabilityText = normalizeText(String(fields.availability ?? ""));
  const portfolioText = normalizeText(String(fields.portfolio ?? ""));
  const portfolioProvided =
    portfolioText.length > 0 && !["no", "none", "n/a", "na"].includes(portfolioText);

  const experienceYears = parseExperienceYears(fields.experienceYears);
  const hasPortfolio =
    hasPortfolioLink(portfolioText) || hasPortfolioLink(message) || portfolioProvided;

  const matchesPriorityRole = includesAny(roleText, getPriorityRoleKeywords());
  const availabilitySoon = availabilityText
    ? includesAny(availabilityText, AVAILABILITY_KEYWORDS)
    : false;
  const experience3Plus = experienceYears !== null ? experienceYears >= 3 : false;
  const askedAboutPayOrRoles = message ? includesAny(message, PAY_ROLE_KEYWORDS) : false;
  const wantsHumanHelp = message ? includesAny(message, HUMAN_HELP_KEYWORDS) : false;

  let score = 0;
  if (hasPortfolio) score += 25;
  if (matchesPriorityRole) score += 20;
  if (availabilitySoon) score += 15;
  if (experience3Plus) score += 10;
  if (askedAboutPayOrRoles) score += 10;
  if (wantsHumanHelp) score += 20;

  if (score > 100) score = 100;

  return {
    score,
    signals: {
      hasPortfolio,
      matchesPriorityRole,
      availabilitySoon,
      experience3Plus,
      askedAboutPayOrRoles,
      wantsHumanHelp,
    },
  };
}

function parseFields(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return value as Record<string, unknown>;
}

type SuperbotLeadRow = {
  id: string;
  session_id: string;
  type: string;
  status: string;
  score: number;
  fields: unknown;
};

export async function updateLeadScore(input: {
  sessionId: string;
  type: LeadType;
  fields: Record<string, unknown>;
  lastUserMessage?: string | null;
}) {
  const { score, signals } = computeLeadScore(input);

  const existingRows = await sql<SuperbotLeadRow[]>`
    SELECT id, session_id, type, status, score, fields
    FROM goodhive.superbot_leads
    WHERE session_id = ${input.sessionId} AND type = ${input.type}
    LIMIT 1;
  `;

  let lead = existingRows[0];
  if (!lead) {
    const createdRows = await sql<SuperbotLeadRow[]>`
      INSERT INTO goodhive.superbot_leads (session_id, type, status, score)
      VALUES (${input.sessionId}, ${input.type}, 'new', 0)
      RETURNING id, session_id, type, status, score, fields;
    `;
    lead = createdRows[0];
  }

  if (!lead) return;

  const existingFields = parseFields(lead.fields);
  const mergedFields = {
    ...existingFields,
    ...input.fields,
    scoring: {
      score,
      signals,
      updatedAt: new Date().toISOString(),
    },
  };

  const shouldHandoff = score >= 70;
  const nextStatus = shouldHandoff ? "handoff" : lead.status;

  await sql`
    UPDATE goodhive.superbot_leads
    SET score = ${score},
        status = ${nextStatus},
        fields = ${mergedFields},
        updated_at = NOW()
    WHERE id = ${lead.id};
  `;

  if (shouldHandoff) {
    const existingHandoff = await sql`
      SELECT id FROM goodhive.handoffs WHERE lead_id = ${lead.id} LIMIT 1;
    `;

    if (!existingHandoff[0]) {
      const signalList = Object.entries(signals)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .join(", ");

      await sql`
        INSERT INTO goodhive.handoffs (lead_id, note)
        VALUES (${lead.id}, ${`Auto-handoff (score ${score}). Signals: ${signalList || "none"}`});
      `;

      await logSuperbotEvent({
        sessionId: lead.session_id,
        type: "handoff_created",
        metadata: {
          leadId: lead.id,
          score,
          signals,
          source: "auto",
        },
      });

      await notifyHandoff({
        title: "Superbot auto-handoff triggered",
        body: `Lead ${lead.id} scored ${score}. Signals: ${signalList || "none"}.`,
        sessionId: lead.session_id,
        leadId: lead.id,
        metadata: {
          score,
          type: input.type,
          source: "auto",
        },
      });
    }
  }
}
