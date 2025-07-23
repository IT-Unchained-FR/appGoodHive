import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { JWT_SECRET } from "./jwtConfig";

export interface SessionUser {
  user_id: string;
  email: string;
  wallet_address: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return null;
    }

    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);

    return {
      user_id: payload.user_id as string,
      email: payload.email as string,
      wallet_address: payload.wallet_address as string,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
