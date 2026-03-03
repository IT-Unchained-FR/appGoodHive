import {
  Award,
  BriefcaseBusiness,
  FolderKanban,
  GraduationCap,
  Languages,
} from "lucide-react";
import type {
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeProject,
} from "@/lib/talent-profile/resume-data";

type ResumeStructuredSectionsProps = {
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  certifications?: ResumeCertification[];
  projects?: ResumeProject[];
  languages?: ResumeLanguage[];
  emptyMessage?: string;
};

const formatDateLabel = (value?: string) => {
  if (!value) return "Date not provided";
  if (/present|current|now/i.test(value)) return "Present";

  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return value;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) {
    return undefined;
  }

  return `${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`;
};

const hasContent = (value?: string) => Boolean(value?.trim());

export function ResumeStructuredSections({
  experience = [],
  education = [],
  certifications = [],
  projects = [],
  languages = [],
  emptyMessage = "No imported resume details yet.",
}: ResumeStructuredSectionsProps) {
  const hasStructuredContent =
    experience.length > 0 ||
    education.length > 0 ||
    certifications.length > 0 ||
    projects.length > 0 ||
    languages.length > 0;

  if (!hasStructuredContent) {
    return (
      <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {experience.length > 0 && (
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="gh-pill flex h-10 w-10 items-center justify-center rounded-2xl text-amber-600">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Experience</h3>
              <p className="text-sm text-slate-500">
                {experience.length} imported role{experience.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {experience.map((item, index) => (
              <div
                key={`${item.title || "role"}-${item.company || "company"}-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.title || "Role not specified"}
                  {hasContent(item.company) ? ` at ${item.company}` : ""}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  {[item.location, formatDateRange(item.startDate, item.endDate)]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
                {hasContent(item.description) && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="gh-pill flex h-10 w-10 items-center justify-center rounded-2xl text-amber-600">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Education</h3>
              <p className="text-sm text-slate-500">
                {education.length} imported education item
                {education.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {education.map((item, index) => (
              <div
                key={`${item.degree || "degree"}-${item.institution || "institution"}-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.degree || "Degree not specified"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.institution || "Institution not specified"}
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  {[item.location, formatDateRange(item.startDate, item.endDate)]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
                {hasContent(item.gpa) && (
                  <p className="mt-3 text-sm text-slate-600">GPA: {item.gpa}</p>
                )}
                {hasContent(item.description) && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(certifications.length > 0 || projects.length > 0) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {certifications.length > 0 && (
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="gh-pill flex h-10 w-10 items-center justify-center rounded-2xl text-amber-600">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Certifications
                  </h3>
                  <p className="text-sm text-slate-500">
                    {certifications.length} imported certification
                    {certifications.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {certifications.map((item, index) => (
                  <div
                    key={`${item.name || "cert"}-${item.issuer || "issuer"}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name || "Certification"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {[item.issuer, item.date ? formatDateLabel(item.date) : undefined]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                    {hasContent(item.description) && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="gh-pill flex h-10 w-10 items-center justify-center rounded-2xl text-amber-600">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Projects</h3>
                  <p className="text-sm text-slate-500">
                    {projects.length} imported project{projects.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {projects.map((item, index) => (
                  <div
                    key={`${item.name || "project"}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name || "Project"}
                    </p>
                    {hasContent(item.technologies) && (
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        {item.technologies}
                      </p>
                    )}
                    {hasContent(item.description) && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    )}
                    {hasContent(item.url) && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm font-medium text-amber-700 underline underline-offset-2"
                      >
                        View project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {languages.length > 0 && (
        <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="gh-pill flex h-10 w-10 items-center justify-center rounded-2xl text-amber-600">
              <Languages className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Languages</h3>
              <p className="text-sm text-slate-500">
                {languages.length} imported language
                {languages.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {languages.map((item, index) => (
              <span
                key={`${item.language || "language"}-${item.proficiency || "level"}-${index}`}
                className="inline-flex rounded-full border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm font-medium text-slate-800"
              >
                {[item.language, item.proficiency].filter(Boolean).join(" - ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
