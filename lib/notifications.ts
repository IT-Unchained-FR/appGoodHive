import sql from "@/lib/db";

export type NotificationType =
  | "job_approved"
  | "job_rejected"
  | "assignment_request"
  | "assignment_accepted"
  | "assignment_rejected"
  | "application_received"
  | "mission_complete_requested"
  | "mission_completed"
  | "payout_released"
  | "new_message";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

export async function createNotification(
  params: CreateNotificationParams,
): Promise<void> {
  try {
    await sql`
      INSERT INTO goodhive.notifications (user_id, type, title, body, data)
      VALUES (
        ${params.userId}::uuid,
        ${params.type},
        ${params.title},
        ${params.body ?? null},
        ${params.data ? JSON.stringify(params.data) : null}
      )
    `;
  } catch (error) {
    // Notifications are non-critical — log but never throw
    console.error("Failed to create notification:", error);
  }
}
