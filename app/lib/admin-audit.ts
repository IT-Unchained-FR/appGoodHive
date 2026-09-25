import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { getAdminJWTSecret } from "@/app/lib/admin-auth";
import sql from "@/lib/db";

export type AdminAuditTarget = "company" | "talent" | "job" | "user" | "admin" | "settings";

/** Email of the signed-in admin, from the admin_token cookie. */
function getActingAdminEmail(): string {
  try {
    const token = cookies().get("admin_token")?.value;
    if (!token) return "unknown";
    const payload = jwt.verify(token, getAdminJWTSecret()) as { email?: unknown };
    return typeof payload.email === "string" && payload.email ? payload.email : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Records an admin action in goodhive.admin_audit_log. Awaited so the write
 * finishes before a serverless function returns; never throws, so a logging
 * failure can't fail the action itself.
 */
export async function logAdminAction(params: {
  action: string;
  targetType: AdminAuditTarget;
  targetId: string | string[];
  details?: Record<string, unknown>;
}): Promise<void> {
  const adminEmail = getActingAdminEmail();
  const targetIds = Array.isArray(params.targetId) ? params.targetId : [params.targetId];
  if (targetIds.length === 0) return;

  try {
    await sql`
      INSERT INTO goodhive.admin_audit_log ${sql(
        targetIds.map((targetId) => ({
          admin_email: adminEmail,
          action: params.action,
          target_type: params.targetType,
          target_id: targetId,
          details: JSON.stringify(params.details ?? {}),
        })),
      )}
    `;
  } catch (error) {
    console.error(`Failed to write admin audit log (${params.action}):`, error);
  }
}
