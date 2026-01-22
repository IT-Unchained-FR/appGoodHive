export type ApplicationStatus = 'new' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired';

export interface IJobApplication {
  id: number;
  job_id: string;
  applicant_user_id: string;
  company_user_id: string;
  applicant_name: string;
  applicant_email: string;
  cover_letter: string;
  portfolio_link?: string;
  status: ApplicationStatus;
  internal_notes?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface IJobApplicationWithDetails extends IJobApplication {
  job_title?: string;
  company_name?: string;
  applicant_image_url?: string;
  applicant_headline?: string;
}

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}> = {
  new: {
    label: 'New',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  reviewed: {
    label: 'Reviewed',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  interview: {
    label: 'Interview',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  hired: {
    label: 'Hired',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
};
