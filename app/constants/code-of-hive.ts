/**
 * Code of the Hive — canonical content, versioned.
 *
 * The Code text lives here rather than inline in JSX so that
 * `talents.code_of_hive_version` stays meaningful: when the wording changes we
 * publish a new version key and old signatures still resolve to the exact text
 * the member agreed to.
 *
 * Changing any wording below REQUIRES a new version entry. Never edit a
 * published version in place.
 */

export const CODE_OF_HIVE_VERSION = "1.0";

/**
 * Cohort assigned to signatures made now. The badge artwork carries a season
 * label, so a new artwork year means a new cohort key plus an asset entry —
 * never a migration.
 */
export const CODE_OF_HIVE_COHORT = "nuptial-flight-2026";

export const CODE_OF_HIVE_PATH = "/code-of-the-hive";

export interface CodeOfHivePrinciple {
  /** Roman numeral as displayed in the Code. */
  numeral: string;
  title: string;
  body: string[];
}

export interface CodeOfHiveContent {
  version: string;
  title: string;
  intro: string[];
  principles: CodeOfHivePrinciple[];
  commitment: {
    heading: string;
    lines: string[];
    /** Rendered with emphasis as the closing line. */
    closing: string;
  };
}

const VERSION_1_0: CodeOfHiveContent = {
  version: "1.0",
  title: "The Code of the Hive",
  intro: [
    "GoodHive is built on trust.",
    "By joining the Hive, I give my word to uphold these seven principles.",
  ],
  principles: [
    {
      numeral: "I",
      title: "Stand by your word",
      body: [
        "Be honest about your skills, experience and limits.",
        "Make commitments carefully. Honor them.",
      ],
    },
    {
      numeral: "II",
      title: "Recommend people, not profiles",
      body: [
        "Understand the client before making a recommendation.",
        "Recommend people you know and trust — or people you have personally assessed.",
        "Never recommend someone you wouldn't put your own reputation behind.",
      ],
    },
    {
      numeral: "III",
      title: "Put the client's interest first",
      body: [
        "A recommendation is a responsibility, not an opportunity to push a candidate.",
        "The right match matters more than making a placement.",
      ],
    },
    {
      numeral: "IV",
      title: "Protect shared reputation",
      body: [
        "Every recommendation carries your name and reflects on GoodHive.",
        "Trust travels through the network. So does reputation.",
      ],
    },
    {
      numeral: "V",
      title: "Contribute when you can",
      body: [
        "Hiring Sprints are voluntary.",
        "But when your knowledge, judgment or network can help, step in.",
        "Contribution builds reputation — and is rewarded when it creates value.",
      ],
    },
    {
      numeral: "VI",
      title: "Honor the Hive",
      body: [
        "Never bypass the Hive when an opportunity or relationship comes through GoodHive.",
        "Respect those who created the connection and contributed to its success.",
        "Honor introductions. Honor contributions. Share the value created.",
      ],
    },
    {
      numeral: "VII",
      title: "Grow by sharing value",
      body: [
        "GoodHive grows when contribution is recognized and rewarded.",
        "Excellence, introductions, validation and mentoring create real value.",
        "Those who create value share in the reputation, opportunities and revenue it generates.",
      ],
    },
  ],
  commitment: {
    heading: "The Commitment",
    lines: [
      "I recommend with judgment.",
      "I stand behind the people I recommend.",
      "I respect the trust placed in me.",
      "I contribute when I can genuinely help.",
      "I honor the connections made through the Hive.",
      "I recognize contribution and share the value we create.",
      "I treat GoodHive's reputation with the same care as my own.",
    ],
    closing: "I give my word.",
  },
};

const CODE_OF_HIVE_VERSIONS: Record<string, CodeOfHiveContent> = {
  "1.0": VERSION_1_0,
};

/** Content currently shown on the public page and offered for signature. */
export const CODE_OF_HIVE_CONTENT = CODE_OF_HIVE_VERSIONS[CODE_OF_HIVE_VERSION];

/**
 * Resolve the text a member actually signed. Returns null for unknown versions
 * rather than falling back to current, so we never misrepresent a signature.
 */
export function getCodeOfHiveContent(
  version: string | null | undefined,
): CodeOfHiveContent | null {
  if (!version) return null;
  return CODE_OF_HIVE_VERSIONS[version] ?? null;
}

export function isKnownCodeOfHiveVersion(version: unknown): version is string {
  return typeof version === "string" && version in CODE_OF_HIVE_VERSIONS;
}

/**
 * Badge artwork per cohort. Add a new entry when new artwork ships.
 *
 * `seal` is a WebP derived from the 1448x1086 source PNG — the original is
 * ~1.5MB, which is far too heavy to ship for a decorative seal.
 */
export const CODE_OF_HIVE_BADGE_ASSETS: Record<
  string,
  { seal: string; sealSource: string; label: string; width: number; height: number }
> = {
  "nuptial-flight-2026": {
    seal: "/img/code-of-hive-badge.webp",
    sealSource: "/img/Code_Of_The_Hive_Nuptial_Flight.png",
    label: "Nuptial Flight 2026",
    width: 800,
    height: 600,
  },
};

export function getCodeOfHiveBadgeAsset(cohort: string | null | undefined) {
  if (!cohort) return CODE_OF_HIVE_BADGE_ASSETS[CODE_OF_HIVE_COHORT];
  return (
    CODE_OF_HIVE_BADGE_ASSETS[cohort] ??
    CODE_OF_HIVE_BADGE_ASSETS[CODE_OF_HIVE_COHORT]
  );
}

/** UI copy, kept next to the Code so wording changes stay in one place. */
export const CODE_OF_HIVE_COPY = {
  ctaLoggedOut: "Join the Code",
  ctaSign: "I give my word",
  signDisclaimer:
    "By signing, I commit to uphold the Code of the Hive and to protect the trust placed in me by clients and fellow members.",
  modalTitle: "Give your word?",
  modalBody:
    "By signing the Code of the Hive, you publicly commit to uphold its principles as a member of GoodHive.",
  modalCancel: "Cancel",
  modalConfirm: "Sign the Code",
  successTitle: "Welcome to the Code of the Hive.",
  successBody: "Your word is now part of your GoodHive reputation.",
  successCta: "View my profile",
  badgeTitle: "Code of the Hive",
  alreadySigned: "You have already given your word.",
  connecting: "Signing you in…",
} as const;

/**
 * Social proof line, e.g. "312 members have given their word."
 * Returns null below a threshold — "2 members have given their word" reads as
 * weakness, not proof.
 */
export function formatSignatoryCount(
  count: number | null | undefined,
  minimumToShow = 5,
): string | null {
  if (typeof count !== "number" || !Number.isFinite(count)) return null;
  if (count < minimumToShow) return null;
  return `${count.toLocaleString("en-US")} members have given their word.`;
}

/** Badge subtitle, e.g. "Member since August 2026". */
export function formatMemberSince(
  signedAt: string | Date | null | undefined,
): string | null {
  if (!signedAt) return null;
  const date = signedAt instanceof Date ? signedAt : new Date(signedAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Member since ${date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })}`;
}
