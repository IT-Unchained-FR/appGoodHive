/**
 * Deterministic hard-constraint handling for talent search.
 *
 * Location and language are contractual requirements, not preferences. An LLM
 * asked to "consider" them will leak — so the rules live here, in plain code,
 * and the model's score is only ever allowed to reorder candidates that have
 * already passed.
 *
 * Pure module: no DB, no network, no LLM. Safe to unit-test directly.
 */

import {
  WORKING_PROFICIENCY_RANK,
  normalizeLanguage,
  normalizeProficiency,
} from "@/app/constants/languages";

export type WorkMode = "onsite" | "hybrid" | "remote" | "any";

export const WORK_MODES: WorkMode[] = ["any", "onsite", "hybrid", "remote"];

export function isWorkMode(value: unknown): value is WorkMode {
  return typeof value === "string" && (WORK_MODES as string[]).includes(value);
}

export interface SearchConstraints {
  workMode: WorkMode;
  country: string | null;
  city: string | null;
  requiredLanguages: string[];
}

/** A language the talent has, already normalised to the controlled vocabulary. */
export interface TalentLanguage {
  code: string;
  label: string;
  /** null when the talent listed a language but no level — unknown, not weak. */
  proficiencyRank: number | null;
}

export interface ConstrainedTalent {
  country: string | null;
  city: string | null;
  remoteOnly: boolean | null;
  languages: TalentLanguage[];
}

export const EMPTY_CONSTRAINTS: SearchConstraints = {
  workMode: "any",
  country: null,
  city: null,
  requiredLanguages: [],
};

/**
 * Onsite and hybrid both require the talent to be physically present, so they
 * filter identically. Remote and "any" impose no location requirement.
 */
export function requiresPresence(workMode: WorkMode): boolean {
  return workMode === "onsite" || workMode === "hybrid";
}

/** True when the search actually narrows anything. */
export function hasActiveConstraints(constraints: SearchConstraints): boolean {
  return (
    (requiresPresence(constraints.workMode) && Boolean(constraints.country)) ||
    constraints.requiredLanguages.length > 0
  );
}

/**
 * `resume_languages` is written by the resume importer as a JSON string of
 * `{ language, proficiency }`, but older rows and manual edits can hold a plain
 * string array or an empty `"[]"`. Anything unparseable is treated as "unknown",
 * never as "speaks nothing".
 *
 * Every entry is normalised through the controlled vocabulary, which also drops
 * the programming languages the resume importer used to scrape out of CV
 * "Languages" sections (Python, Rust, Solidity were all in production data).
 */
export function parseTalentLanguages(raw: string | null | undefined): TalentLanguage[] {
  if (!raw || !raw.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Tolerate a bare comma-separated list.
    return raw
      .split(",")
      .map((entry) => normalizeLanguage(entry))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map((entry) => ({ code: entry.code, label: entry.label, proficiencyRank: null }));
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((entry) => {
      if (typeof entry === "string") return { language: entry, proficiency: null };
      if (entry && typeof entry === "object" && "language" in entry) {
        const record = entry as { language?: unknown; proficiency?: unknown };
        return {
          language: typeof record.language === "string" ? record.language : "",
          proficiency: typeof record.proficiency === "string" ? record.proficiency : null,
        };
      }
      return { language: "", proficiency: null };
    })
    .map((entry) => {
      const canonical = normalizeLanguage(entry.language);
      if (!canonical) return null;
      return {
        code: canonical.code,
        label: canonical.label,
        // Unrecognised or absent proficiency stays null — unknown, not weak.
        proficiencyRank: normalizeProficiency(entry.proficiency)?.rank ?? null,
      };
    })
    .filter((entry): entry is TalentLanguage => entry !== null);
}

function sameCountry(left: string | null, right: string | null): boolean {
  if (!left || !right) return false;
  return left.trim().toUpperCase() === right.trim().toUpperCase();
}

export type ConstraintViolation = {
  /** Machine-readable so the UI can explain which filter emptied the list. */
  code: "wrong_country" | "remote_only";
  reason: string;
};

/**
 * The post-scoring guard. A talent failing this is never returned, whatever the
 * model scored them.
 *
 * Language is deliberately NOT enforced here. Fewer than a quarter of profiles
 * carry language data, so excluding on it would drop most of the pool for
 * missing information — a worse failure than the bug this fixes. Language is
 * handled as a soft signal via `languageGap`.
 */
export function findConstraintViolation(
  talent: ConstrainedTalent,
  constraints: SearchConstraints,
): ConstraintViolation | null {
  if (!requiresPresence(constraints.workMode) || !constraints.country) return null;

  if (talent.country && !sameCountry(talent.country, constraints.country)) {
    return {
      code: "wrong_country",
      reason: `Based in ${talent.country}, role requires presence in ${constraints.country}`,
    };
  }

  // Explicit remote-only is a confirmed "no". NULL means the talent never
  // answered, which is unknown — keep them and let a recruiter decide.
  if (talent.remoteOnly === true) {
    return {
      code: "remote_only",
      reason: "Available for remote work only",
    };
  }

  return null;
}

export interface LanguageAssessment {
  /** Required languages the talent does not list at all. */
  missing: string[];
  /** Required languages listed, but below working (B2) proficiency. */
  belowWorkingLevel: string[];
  /** True when the talent has no language data at all — unknown, not absent. */
  unknown: boolean;
}

/**
 * Compares a talent's normalised languages against the requirement. Both sides
 * go through the controlled vocabulary, so "Français", "french" and "FRENCH"
 * all resolve to the same language.
 */
export function assessLanguages(
  talent: ConstrainedTalent,
  constraints: SearchConstraints,
): LanguageAssessment {
  const required = constraints.requiredLanguages
    .map((language) => normalizeLanguage(language))
    .filter((language): language is NonNullable<typeof language> => language !== null);

  if (required.length === 0) {
    return { missing: [], belowWorkingLevel: [], unknown: false };
  }

  if (talent.languages.length === 0) {
    return { missing: [], belowWorkingLevel: [], unknown: true };
  }

  const spoken = new Map(talent.languages.map((language) => [language.code, language]));
  const missing: string[] = [];
  const belowWorkingLevel: string[] = [];

  for (const language of required) {
    const held = spoken.get(language.code);
    if (!held) {
      missing.push(language.label);
      continue;
    }
    // An unstated level is unknown, not weak — never counted against them.
    if (held.proficiencyRank !== null && held.proficiencyRank < WORKING_PROFICIENCY_RANK) {
      belowWorkingLevel.push(language.label);
    }
  }

  return { missing, belowWorkingLevel, unknown: false };
}

/**
 * Soft language check. Returns a gap string to surface in the UI, or null when
 * there is nothing to flag.
 */
export function languageGap(
  talent: ConstrainedTalent,
  constraints: SearchConstraints,
): string | null {
  const required = constraints.requiredLanguages
    .map((language) => normalizeLanguage(language)?.label)
    .filter((label): label is string => Boolean(label));
  if (required.length === 0) return null;

  const assessment = assessLanguages(talent, constraints);

  if (assessment.unknown) {
    return `Languages not on profile — verify ${required.join(", ")}`;
  }
  if (assessment.missing.length > 0) {
    return `No evidence of ${assessment.missing.join(", ")}`;
  }
  if (assessment.belowWorkingLevel.length > 0) {
    return `${assessment.belowWorkingLevel.join(", ")} below working proficiency`;
  }
  return null;
}

/**
 * Down-ranks a candidate whose languages are known not to match. Profiles with
 * no language data are left untouched — unknown must not be penalised as absent.
 * A listed language below B2 costs less than a missing one.
 */
export function applyLanguagePenalty(
  score: number | null,
  talent: ConstrainedTalent,
  constraints: SearchConstraints,
): number | null {
  if (score === null) return null;

  const assessment = assessLanguages(talent, constraints);
  if (assessment.unknown) return score;

  const penalty =
    25 * assessment.missing.length + 10 * assessment.belowWorkingLevel.length;

  return Math.max(0, score - penalty);
}
