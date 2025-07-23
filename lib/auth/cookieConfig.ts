export const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

export const secureCookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SEVEN_DAYS_IN_SECONDS,
  path: "/",
};

// For sensitive data that should only be accessible server-side
export const secureHttpOnlyCookieConfig = {
  ...secureCookieConfig,
  httpOnly: true,
};

// For data that needs to be accessed by client-side JavaScript
export const clientAccessibleCookieConfig = {
  ...secureCookieConfig,
  httpOnly: false,
};
