export interface TalentProfileData {
  skills: string;
  title: string;
  first_name: string;
  last_name: string;
  image_url: string;
  about_work: string;
  cv_url: string;
  description: string;
  email: string;
  phone_number: string;
  phone_country_code: string;
  city: string;
  min_rate?: number;
  max_rate?: number;
  rate?: number;
  country: string;
  linkedin: string;
  telegram: string;
  github: string;
  stackoverflow: string;
  portfolio: string;
  freelance_only: boolean;
  remote_only: boolean;
  talent_status: string;
  talent_approved: boolean;
  talent: boolean;
  recruiter: boolean;
  mentor: boolean;
  mentor_status: string;
  recruiter_status: string;
  twitter: string;
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
