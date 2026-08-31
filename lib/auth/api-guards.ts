import { NextResponse } from "next/server";

import { getViewerAccess, type ViewerAccess } from "@/lib/auth/viewer-access";
import { getSessionUser } from "@/lib/auth/sessionUtils";

/**
 * Route-handler guards.
 *
 * IMPORTANT: identity here comes only from the signed `session_token` cookie
 * (via `getSessionUser`). The `user_id` cookie is written with
 * `httpOnly: false` for legacy client code and the `x-user-id` header is
 * caller-supplied, so neither can be trusted for authorization — anyone can
 * set them to another user's id.
 */

export type GuardFailure = { ok: false; response: NextResponse };
export type SessionSuccess = { ok: true; userId: string };
export type AccessSuccess = { ok: true; userId: string | null; access: ViewerAccess };

const unauthorized = (): GuardFailure => ({
  ok: false,
  response: NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 },
  ),
});

const forbidden = (error = "Forbidden"): GuardFailure => ({
  ok: false,
  response: NextResponse.json({ success: false, error }, { status: 403 }),
});

/** Session-backed user id, or null. Never derived from client-writable input. */
export async function getApiUserId(): Promise<string | null> {
  const sessionUser = await getSessionUser();
  return sessionUser?.user_id ?? null;
}

/** Requires any signed-in user. */
export async function requireApiSession(): Promise<SessionSuccess | GuardFailure> {
  const userId = await getApiUserId();

  if (!userId) {
    return unauthorized();
  }

  return { ok: true, userId };
}

/**
 * Requires a viewer entitled to confidential data: an admin, an approved
 * talent, or the owner of an approved company. Mirrors the page-level gate in
 * `getViewerAccess()` so the API cannot be used to bypass the UI.
 */
export async function requireConfidentialAccess(): Promise<
  AccessSuccess | GuardFailure
> {
  const access = await getViewerAccess();

  if (!access.canViewConfidentialInfo) {
    return forbidden(
      "A verified GoodHive profile is required to view these details.",
    );
  }

  return { ok: true, access, userId: access.userId };
}

/** Requires the session user to be `targetUserId`, or an admin. */
export async function requireSelfOrAdmin(
  targetUserId: string | null | undefined,
): Promise<AccessSuccess | GuardFailure> {
  const access = await getViewerAccess();

  if (!access.isAuthenticated && !access.isAdmin) {
    return unauthorized();
  }

  if (!access.isAdmin && (!targetUserId || access.userId !== targetUserId)) {
    return forbidden();
  }

  return { ok: true, access, userId: access.userId };
}

/** Requires a valid admin session cookie. */
export async function requireApiAdmin(): Promise<AccessSuccess | GuardFailure> {
  const access = await getViewerAccess();

  if (!access.isAdmin) {
    return forbidden("Admin access required");
  }

  return { ok: true, access, userId: access.userId };
}

/** Resolves viewer access without rejecting — for partial redaction. */
export async function readViewerAccess(): Promise<ViewerAccess> {
  return getViewerAccess();
}
