export type MessengerThreadType = "direct" | "application" | "request" | "job";
export type MessengerMessageType = "text" | "file" | "system";
export type JobRequestStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "archived";

export interface JobRequest {
  id: string;
  company_user_id: string;
  talent_user_id: string;
  job_id?: string | null;
  title: string;
  request_message?: string | null;
  status: JobRequestStatus;
  created_at: string;
  updated_at: string;
  company_name?: string | null;
  company_avatar?: string | null;
  talent_name?: string | null;
  talent_avatar?: string | null;
  other_user_id?: string | null;
}

export interface MessengerThread {
  id: string;
  company_user_id: string;
  talent_user_id: string;
  thread_type: MessengerThreadType;
  job_id?: string | null;
  job_application_id?: number | null;
  job_request_id?: string | null;
  created_by_user_id: string;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessengerThreadListItem extends MessengerThread {
  other_user_id: string;
  other_user_name?: string | null;
  other_user_avatar?: string | null;
  other_user_headline?: string | null;
  last_message_id?: string | null;
  last_message_text?: string | null;
  last_message_sender_user_id?: string | null;
  unread_count: number;
}

export interface MessengerMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  message_type: MessengerMessageType;
  message_text: string;
  attachment_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMessengerThreadRequest {
  companyUserId: string;
  talentUserId: string;
  threadType?: MessengerThreadType;
  jobId?: string;
  jobApplicationId?: number;
  jobRequestId?: string;
  actorUserId?: string;
}

export interface CreateMessengerMessageRequest {
  senderUserId?: string;
  messageText: string;
  messageType?: MessengerMessageType;
  attachmentUrl?: string;
}

export interface MarkThreadReadRequest {
  userId?: string;
  readAt?: string;
}

export interface CreateJobRequestBody {
  companyUserId: string;
  talentUserId: string;
  title: string;
  requestMessage?: string;
  jobId?: string;
  actorUserId?: string;
}
