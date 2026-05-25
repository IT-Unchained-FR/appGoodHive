export type Stage = "shortlisted" | "contacted" | "interviewing" | "hired" | "rejected";

export interface PipelineEntry {
  id: string;
  talent_id: string;
  stage: Stage;
  notes: string | null;
  job_id: string | null;
  created_at: string;
  updated_at: string;
  talent_name: string | null;
  talent_image: string | null;
  talent_skills: string | null;
  talent_title: string | null;
  talent_bio: string | null;
  talent_experience: string | null;
  talent_min_rate: number | null;
  talent_max_rate: number | null;
  talent_availability: string | null;
}

export type PipelineData = Record<Stage, PipelineEntry[]>;

export const STAGES: {
  key: Stage;
  label: string;
  color: string;
  dot: string;
  bg: string;
}[] = [
  { key: "shortlisted",  label: "Shortlisted",  color: "border-t-amber-400",   dot: "bg-amber-400",   bg: "bg-amber-100 text-amber-700" },
  { key: "contacted",    label: "Contacted",    color: "border-t-blue-400",    dot: "bg-blue-400",    bg: "bg-blue-100 text-blue-700" },
  { key: "interviewing", label: "Interviewing", color: "border-t-purple-400",  dot: "bg-purple-400",  bg: "bg-purple-100 text-purple-700" },
  { key: "hired",        label: "Hired",        color: "border-t-emerald-400", dot: "bg-emerald-400", bg: "bg-emerald-100 text-emerald-700" },
  { key: "rejected",     label: "Rejected",     color: "border-t-rose-300",    dot: "bg-rose-300",    bg: "bg-rose-100 text-rose-600" },
];

export const VALID_STAGES: Stage[] = ["shortlisted", "contacted", "interviewing", "hired", "rejected"];
