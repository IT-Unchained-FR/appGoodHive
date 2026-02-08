import type { GoogleAuthOptions } from "google-auth-library";

type ServiceAccountJson = {
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

const normalizePrivateKey = (value?: string) =>
  value ? value.replace(/\\n/g, "\n") : value;

export const getGoogleAuthOptions = (): GoogleAuthOptions | undefined => {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!json) return undefined;

  try {
    const parsed = JSON.parse(json) as ServiceAccountJson;
    if (!parsed.client_email || !parsed.private_key) return undefined;
    return {
      credentials: {
        ...parsed,
        private_key: normalizePrivateKey(parsed.private_key),
      },
    };
  } catch {
    return undefined;
  }
};
