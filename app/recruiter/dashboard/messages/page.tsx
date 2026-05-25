import { redirect } from "next/navigation";

/**
 * Recruiter Messages — redirects to the shared /messages inbox.
 * Recruiters can create threads with talents directly from the pipeline.
 * The messenger supports recruiters as the "company side" of a thread.
 */
export default function RecruiterDashboardMessagesPage() {
  redirect("/messages");
}
