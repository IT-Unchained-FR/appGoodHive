// Turns raw wallet / RPC / contract errors into short, plain messages with a
// clear next step. Raw errors should still be logged by the caller.

// Thrown for messages we write ourselves; shown to the user unchanged.
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

// Wallet libraries nest the real error under `cause`, `error` or `data`, so
// gather codes and text from the whole chain.
function collectErrorDetails(err: unknown): { codes: unknown[]; text: string } {
  const codes: unknown[] = [];
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = err;

  for (let depth = 0; depth < 6 && current && !seen.has(current); depth++) {
    seen.add(current);

    if (typeof current === "string") {
      parts.push(current);
      break;
    }

    if (typeof current !== "object") break;

    const record = current as Record<string, unknown>;
    if (record.code !== undefined) codes.push(record.code);
    for (const key of ["message", "shortMessage", "details", "reason"]) {
      if (typeof record[key] === "string") parts.push(record[key] as string);
    }

    current = record.cause ?? record.error ?? record.data;
  }

  return { codes, text: parts.join(" ").toLowerCase() };
}

export function getFriendlyWalletError(err: unknown, fallback: string): string {
  if (err instanceof UserFacingError) return err.message;

  const { codes, text } = collectErrorDetails(err);
  const hasCode = (...values: unknown[]) => codes.some((code) => values.includes(code));

  if (
    hasCode(4001, "ACTION_REJECTED") ||
    /user (rejected|denied|cancel)|rejected the request|request rejected/.test(text)
  ) {
    return "You cancelled the transaction in your wallet.";
  }

  if (/insufficient funds|gas required exceeds|not enough (gas|funds)/.test(text)) {
    return "You need a little MATIC to pay the network fee. Add MATIC to your wallet and try again.";
  }

  if (
    hasCode(4902) ||
    /chain ?id mismatch|wrong network|does not match the target chain|unrecognized chain|chain mismatch/.test(text)
  ) {
    return "Your wallet is on the wrong network. Switch to Polygon and try again.";
  }

  if (hasCode("RATE_LIMITED", 429) || /rate limit|too many requests/.test(text)) {
    return "The network is busy right now. Please wait a minute and try again.";
  }

  if (/execution reverted|transaction reverted|revert/.test(text)) {
    return "The transaction was rejected by the contract. Please check the details and try again.";
  }

  if (/network error|failed to fetch|timeout|timed out/.test(text)) {
    return "We couldn't reach the network. Check your connection and try again.";
  }

  return fallback;
}
