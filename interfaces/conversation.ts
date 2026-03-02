import { ApplicationStatus } from "@/interfaces/job-application";

export type ConversationThreadStatus =
  | "open"
  | "awaiting_company"
  | "awaiting_talent"
  | "archived"
  | "closed"
  | "job_closed"
  | "blocked";

export type ConversationParticipantRole = "company" | "talent" | "admin";

export type ConversationMessageType = "application_intro" | "text" | "system";

export interface IConversationSummary {
  id: string;
  job_id: string;
  job_application_id: number;
  status: ConversationThreadStatus;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
  job_title: string;
  application_status: ApplicationStatus;
  applied_at: string;
  talent_user_id: string;
  talent_name: string;
  talent_email: string;
  talent_image_url?: string | null;
  talent_headline?: string | null;
  company_user_id?: string;
  company_name?: string | null;
  company_image_url?: string | null;
  company_headline?: string | null;
  unread_count: number;
}

export interface IConversationMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  sender_role: ConversationParticipantRole | "system";
  message_type: ConversationMessageType;
  body: string;
  body_plaintext: string;
  created_at: string;
  edited_at?: string | null;
}

export interface IConversationThreadDetail {
  id: string;
  job_id: string;
  job_application_id: number;
  status: ConversationThreadStatus;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message_preview: string | null;
  job_title: string;
  application_status: ApplicationStatus;
  talent_user_id: string;
  talent_name: string;
  talent_email: string;
  talent_image_url?: string | null;
  talent_headline?: string | null;
  company_user_id?: string;
  company_name?: string | null;
  company_image_url?: string | null;
  company_headline?: string | null;
  viewer_role: ConversationParticipantRole;
  can_reply: boolean;
  counterpart_is_typing: boolean;
  counterpart_last_active_at?: string | null;
  has_two_way_exchange: boolean;
}
