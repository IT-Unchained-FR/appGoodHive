export type ProfileData = {
  first_name: string;
  last_name: string;
  image_url?: string;
  cv_url?: string;
  title?: string;
  description?: string;
  country?: string;
  city?: string;
  phone_country_code?: string;
  phone_number?: string;
  email: string;
  about_work?: string;
  rate?: number;
  freelance_only?: boolean;
  remote_only?: boolean;
  skills?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  stackoverflow?: string;
  portfolio?: string;
  telegram?: string;
  talent?: boolean;
  mentor?: boolean;
  recruiter?: boolean;
  talent_status?: string;
  mentor_status?: string;
  recruiter_status?: string;
  hide_contact_details?: boolean;
  referrer?: string;
  availability?: boolean;
  wallet_address?: string;
  approved: boolean;
  user_id?: string;
  inreview?: boolean;
  referred_by?: string;
  approved_roles?: object[];
  experience?: any[];
  education?: any[];
  current_company?: string;
};

export interface CountryOption {
  value: string;
  label: string;
  phoneCode: string;
}
