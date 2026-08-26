/**
 * Controlled vocabulary for spoken languages on talent profiles.
 *
 * This exists because the field used to be free text, and the data it produced
 * could not be matched against: "french" / "French" / "FRENCH" as three values,
 * "Bangali" for Bengali, 16 different spellings of five proficiency levels, and
 * programming languages (Python, Rust, Solidity) scraped out of CV "Languages"
 * sections by the resume importer.
 *
 * Storage stays `{ language, proficiency }` so existing rows keep working — what
 * changes is that both sides are now normalised through here before comparison.
 */

export interface LanguageOption {
  /** ISO 639-1 where one exists. Stable key for matching. */
  code: string;
  /** Canonical English label. This is what gets stored. */
  label: string;
  /** Lowercase spellings seen in real data or likely to be typed. */
  aliases?: string[];
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", aliases: ["anglais", "inglés", "ingles"] },
  { code: "fr", label: "French", aliases: ["français", "francais", "frances", "francés"] },
  { code: "es", label: "Spanish", aliases: ["español", "espanol", "castellano", "espagnol"] },
  { code: "de", label: "German", aliases: ["deutsch", "allemand", "alemán"] },
  { code: "pt", label: "Portuguese", aliases: ["português", "portugues", "portugais"] },
  { code: "it", label: "Italian", aliases: ["italiano", "italien"] },
  { code: "nl", label: "Dutch", aliases: ["nederlands", "néerlandais", "flemish", "flemish/dutch"] },
  { code: "ru", label: "Russian", aliases: ["русский", "russe"] },
  { code: "uk", label: "Ukrainian", aliases: ["українська"] },
  { code: "pl", label: "Polish", aliases: ["polski", "polonais"] },
  { code: "ro", label: "Romanian", aliases: ["română", "romana"] },
  { code: "tr", label: "Turkish", aliases: ["türkçe", "turkce"] },
  { code: "ar", label: "Arabic", aliases: ["العربية", "arabe"] },
  { code: "he", label: "Hebrew", aliases: ["עברית", "hébreu", "ivrit"] },
  { code: "fa", label: "Persian", aliases: ["farsi", "persan", "dari"] },
  { code: "ur", label: "Urdu", aliases: ["اردو"] },
  { code: "hi", label: "Hindi", aliases: ["हिन्दी"] },
  { code: "bn", label: "Bengali", aliases: ["bangla", "bangali", "bengalese"] },
  { code: "pa", label: "Punjabi", aliases: ["panjabi"] },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "ne", label: "Nepali" },
  { code: "si", label: "Sinhala" },
  { code: "zh", label: "Mandarin Chinese", aliases: ["mandarin", "chinese", "中文", "chinois", "putonghua"] },
  { code: "yue", label: "Cantonese", aliases: ["粤语"] },
  { code: "ja", label: "Japanese", aliases: ["日本語", "japonais"] },
  { code: "ko", label: "Korean", aliases: ["한국어", "coréen"] },
  { code: "vi", label: "Vietnamese", aliases: ["tiếng việt"] },
  { code: "th", label: "Thai" },
  { code: "id", label: "Indonesian", aliases: ["bahasa indonesia", "bahasa"] },
  { code: "ms", label: "Malay", aliases: ["bahasa melayu"] },
  { code: "tl", label: "Filipino", aliases: ["tagalog"] },
  { code: "sw", label: "Swahili", aliases: ["kiswahili"] },
  { code: "yo", label: "Yoruba" },
  { code: "ig", label: "Igbo" },
  { code: "ha", label: "Hausa" },
  { code: "am", label: "Amharic" },
  { code: "af", label: "Afrikaans" },
  { code: "zu", label: "Zulu" },
  { code: "tw", label: "Twi", aliases: ["akan"] },
  { code: "sv", label: "Swedish", aliases: ["svenska"] },
  { code: "no", label: "Norwegian", aliases: ["norsk"] },
  { code: "da", label: "Danish", aliases: ["dansk"] },
  { code: "fi", label: "Finnish", aliases: ["suomi"] },
  { code: "is", label: "Icelandic" },
  { code: "el", label: "Greek", aliases: ["ελληνικά", "grec"] },
  { code: "cs", label: "Czech", aliases: ["čeština"] },
  { code: "sk", label: "Slovak" },
  { code: "hu", label: "Hungarian", aliases: ["magyar"] },
  { code: "bg", label: "Bulgarian" },
  { code: "sr", label: "Serbian" },
  { code: "hr", label: "Croatian" },
  { code: "bs", label: "Bosnian" },
  { code: "sq", label: "Albanian" },
  { code: "lt", label: "Lithuanian" },
  { code: "lv", label: "Latvian" },
  { code: "et", label: "Estonian" },
  { code: "ka", label: "Georgian" },
  { code: "hy", label: "Armenian" },
  { code: "az", label: "Azerbaijani" },
  { code: "kk", label: "Kazakh" },
  { code: "uz", label: "Uzbek" },
  { code: "ca", label: "Catalan", aliases: ["català"] },
  { code: "eu", label: "Basque", aliases: ["euskara"] },
  { code: "gl", label: "Galician" },
  { code: "cy", label: "Welsh" },
  { code: "ga", label: "Irish", aliases: ["gaeilge"] },
];

/** Proficiency, ordered weakest to strongest. `rank` drives matching decisions. */
export interface ProficiencyOption {
  value: string;
  label: string;
  rank: number;
  aliases?: string[];
}

export const PROFICIENCY_LEVELS: ProficiencyOption[] = [
  {
    value: "basic",
    label: "Basic (A1–A2)",
    rank: 1,
    aliases: ["a1", "a2", "beginner", "elementary", "notions", "basique"],
  },
  {
    value: "conversational",
    label: "Conversational (B1)",
    rank: 2,
    aliases: ["b1", "intermediate", "intermédiaire", "intermediaire", "conversational (b1)"],
  },
  {
    value: "professional",
    label: "Professional (B2)",
    rank: 3,
    aliases: [
      "b2",
      "professional",
      "professional (b2)",
      "business",
      "business proficiency",
      "upper intermediate",
      "advanced",
      "proficient",
    ],
  },
  {
    value: "fluent",
    label: "Fluent (C1–C2)",
    rank: 4,
    aliases: ["c1", "c2", "fluent", "courant", "full professional", "fluent (c1)", "fluent (c2)"],
  },
  {
    value: "native",
    label: "Native / Bilingual",
    rank: 5,
    aliases: ["native", "bilingual", "bilingue", "mother tongue", "langue maternelle", "natif"],
  },
];

/** Minimum level that counts as meeting a language requirement. */
export const WORKING_PROFICIENCY_RANK = 3; // professional (B2)

const LANGUAGE_LOOKUP: Map<string, LanguageOption> = (() => {
  const map = new Map<string, LanguageOption>();
  for (const option of LANGUAGES) {
    map.set(option.code.toLowerCase(), option);
    map.set(option.label.toLowerCase(), option);
    for (const alias of option.aliases ?? []) map.set(alias.toLowerCase(), option);
  }
  return map;
})();

const PROFICIENCY_LOOKUP: Map<string, ProficiencyOption> = (() => {
  const map = new Map<string, ProficiencyOption>();
  for (const option of PROFICIENCY_LEVELS) {
    map.set(option.value.toLowerCase(), option);
    map.set(option.label.toLowerCase(), option);
    for (const alias of option.aliases ?? []) map.set(alias.toLowerCase(), option);
  }
  return map;
})();

/**
 * Maps a stored or typed value to a canonical language.
 *
 * Returns null for anything not recognised — which deliberately includes the
 * programming languages the resume importer used to scrape into this field.
 * A null means "this is not a spoken language we can match on", never
 * "this person speaks nothing".
 */
export function normalizeLanguage(raw: string | null | undefined): LanguageOption | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return null;

  const direct = LANGUAGE_LOOKUP.get(key);
  if (direct) return direct;

  // "English (fluent)" / "French - native" → take the leading language name.
  const leading = key.split(/[(\-–—,/|]/)[0]?.trim();
  if (leading && leading !== key) {
    const viaLeading = LANGUAGE_LOOKUP.get(leading);
    if (viaLeading) return viaLeading;
  }

  return null;
}

export function normalizeProficiency(raw: string | null | undefined): ProficiencyOption | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return null;

  const direct = PROFICIENCY_LOOKUP.get(key);
  if (direct) return direct;

  // Catch embedded CEFR codes like "Professional (B2)" or a bare "B2 level".
  const cefr = key.match(/\b([abc][12])\b/);
  if (cefr) {
    const viaCefr = PROFICIENCY_LOOKUP.get(cefr[1]);
    if (viaCefr) return viaCefr;
  }

  for (const [alias, option] of PROFICIENCY_LOOKUP) {
    if (alias.length > 3 && key.includes(alias)) return option;
  }

  return null;
}

/** Canonical label, or the trimmed original when unrecognised (never data loss). */
export function displayLanguage(raw: string | null | undefined): string {
  return normalizeLanguage(raw)?.label ?? (raw ?? "").trim();
}
