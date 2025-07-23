if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET environment variable is not set");
  process.exit(1);
}

if (!process.env.ADMIN_JWT_SECRET) {
  console.error("ADMIN_JWT_SECRET environment variable is not set");
  process.exit(1);
}

export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
export const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET,
);

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const AUTH_ERRORS = {
  INVALID_TOKEN: new AuthError(
    "Invalid or expired token",
    "INVALID_TOKEN",
    401,
  ),
  MISSING_TOKEN: new AuthError(
    "Authentication token is missing",
    "MISSING_TOKEN",
    401,
  ),
  EXPIRED_TOKEN: new AuthError(
    "Authentication token has expired",
    "EXPIRED_TOKEN",
    401,
  ),
  INVALID_SIGNATURE: new AuthError(
    "Invalid token signature",
    "INVALID_SIGNATURE",
    401,
  ),
  CSRF_TOKEN_MISMATCH: new AuthError(
    "CSRF token mismatch",
    "CSRF_TOKEN_MISMATCH",
    403,
  ),
  RATE_LIMITED: new AuthError("Too many requests", "RATE_LIMITED", 429),
  INSUFFICIENT_PERMISSIONS: new AuthError(
    "Insufficient permissions",
    "INSUFFICIENT_PERMISSIONS",
    403,
  ),
};

export function handleAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (error instanceof Error) {
    // Map specific JWT errors to our custom errors
    if (error.message.includes("expired")) {
      return AUTH_ERRORS.EXPIRED_TOKEN;
    }
    if (error.message.includes("signature")) {
      return AUTH_ERRORS.INVALID_SIGNATURE;
    }
  }

  // Default to invalid token for unknown errors
  return AUTH_ERRORS.INVALID_TOKEN;
}
