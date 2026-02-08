export type GuardrailResult = {
  blocked: boolean;
  message?: string;
  redactedText?: string;
};

const SENSITIVE_REQUEST_KEYWORDS = [
  "password",
  "passcode",
  "otp",
  "2fa",
  "social security",
  "ssn",
  "credit card",
  "card number",
  "cvv",
  "cvc",
  "bank account",
  "routing number",
  "passport",
  "driver's license",
  "date of birth",
  "dob",
];

const SENSITIVE_DATA_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b(?:\d[ -]*?){13,16}\b/, // credit card-ish
  /\b\d{9}\b/, // generic 9-digit numbers
];

function normalizeText(text: string) {
  return text.trim().toLowerCase();
}

function containsSensitiveRequest(text: string) {
  return SENSITIVE_REQUEST_KEYWORDS.some((keyword) => text.includes(keyword));
}

function containsSensitiveData(text: string) {
  return SENSITIVE_DATA_PATTERNS.some((pattern) => pattern.test(text));
}

export function redactSensitiveText(text: string) {
  return text.replace(/\d/g, "x");
}

export function evaluateGuardrails(text: string): GuardrailResult {
  const normalized = normalizeText(text);

  if (!normalized) {
    return { blocked: false };
  }

  if (containsSensitiveRequest(normalized)) {
    return {
      blocked: true,
      message:
        "For your security, please don't share passwords, payment details, or sensitive personal data here.",
    };
  }

  if (containsSensitiveData(text)) {
    return {
      blocked: true,
      message:
        "For your security, please remove any sensitive details (like ID or card numbers) and try again.",
      redactedText: redactSensitiveText(text),
    };
  }

  return { blocked: false };
}
