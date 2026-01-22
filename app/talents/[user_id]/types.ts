export interface TalentProfileData {
  skills: string;
  title: string;
  first_name: string;
  last_name: string;
  image_url: string;
  about_work?: string | null;
  cv_url?: string | null;
  description?: string | null;
  email?: string | null;
  phone_number?: string | null;
  phone_country_code?: string | null;
  city: string;
  min_rate?: number;
  max_rate?: number;
  rate?: number;
  country: string;
  linkedin?: string | null;
  telegram?: string | null;
  github?: string | null;
  stackoverflow?: string | null;
  portfolio?: string | null;
  freelance_only: boolean;
  remote_only: boolean;
  talent_status: string;
  talent_approved: boolean;
  talent: boolean;
  recruiter: boolean;
  mentor: boolean;
  mentor_status: string;
  recruiter_status: string;
  twitter?: string | null;
  approved: boolean;
  approved_roles: object[] | null;
  last_active?: string | Date;
  // New stats fields
  years_experience?: number;
  jobs_completed?: number;
  response_time?: string;
  rating?: number;
  // New preference fields
  timezone?: string;
  languages?: string[] | string;
}
