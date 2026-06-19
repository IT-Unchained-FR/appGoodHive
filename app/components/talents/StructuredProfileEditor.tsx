"use client";

import type { ReactNode } from "react";
import type {
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeProject,
} from "@/lib/talent-profile/resume-data";

type StructuredProfileEditorProps = {
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  certifications?: ResumeCertification[];
  projects?: ResumeProject[];
  languages?: ResumeLanguage[];
  onExperienceChange: (items: ResumeExperience[]) => void;
  onEducationChange: (items: ResumeEducation[]) => void;
  onCertificationsChange: (items: ResumeCertification[]) => void;
  onProjectsChange: (items: ResumeProject[]) => void;
  onLanguagesChange: (items: ResumeLanguage[]) => void;
};

function SectionHeader({
  title,
  description,
  onAdd,
}: {
  title: string;
  description: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
      >
        Add item
      </button>
    </div>
  );
}

function OptionalFieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-800">
      {children}
      <span className="ml-1 text-xs font-medium text-slate-400">Optional</span>
    </label>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-500">
      No {label.toLowerCase()} added yet.
    </div>
  );
}

function updateListItem<T>(
  items: T[],
  index: number,
  field: keyof T,
  value: string,
  onChange: (nextItems: T[]) => void,
) {
  const nextItems = items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, [field]: value } : item,
  );
  onChange(nextItems);
}

function removeListItem<T>(
  items: T[],
  index: number,
  onChange: (nextItems: T[]) => void,
) {
  onChange(items.filter((_, itemIndex) => itemIndex !== index));
}

export function StructuredProfileEditor({
  experience = [],
  education = [],
  certifications = [],
  projects = [],
  languages = [],
  onExperienceChange,
  onEducationChange,
  onCertificationsChange,
  onProjectsChange,
  onLanguagesChange,
}: StructuredProfileEditorProps) {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Experience"
        description="Add work history manually if you are not importing from a resume."
        onAdd={() => onExperienceChange([...experience, {}])}
      />
      {experience.length === 0 ? (
        <EmptyState label="Experience" />
      ) : (
        <div className="space-y-4">
          {experience.map((item, index) => (
            <div
              key={`experience-${index}`}
              className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  Experience #{index + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    removeListItem(experience, index, onExperienceChange)
                  }
                  className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <OptionalFieldLabel>Job title</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(event) =>
                      updateListItem(
                        experience,
                        index,
                        "title",
                        event.target.value,
                        onExperienceChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>Company</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.company || ""}
                    onChange={(event) =>
                      updateListItem(
                        experience,
                        index,
                        "company",
                        event.target.value,
                        onExperienceChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>Location</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.location || ""}
                    onChange={(event) =>
                      updateListItem(
                        experience,
                        index,
                        "location",
                        event.target.value,
                        onExperienceChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <OptionalFieldLabel>Start date</OptionalFieldLabel>
                    <input
                      type="month"
                      value={item.startDate || ""}
                      onChange={(event) =>
                        updateListItem(
                          experience,
                          index,
                          "startDate",
                          event.target.value,
                          onExperienceChange,
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <OptionalFieldLabel>End date</OptionalFieldLabel>
                    <input
                      type="text"
                      placeholder="2025-06 or Present"
                      value={item.endDate || ""}
                      onChange={(event) =>
                        updateListItem(
                          experience,
                          index,
                          "endDate",
                          event.target.value,
                          onExperienceChange,
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <OptionalFieldLabel>Description</OptionalFieldLabel>
                <textarea
                  value={item.description || ""}
                  onChange={(event) =>
                    updateListItem(
                      experience,
                      index,
                      "description",
                      event.target.value,
                      onExperienceChange,
                    )
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionHeader
        title="Education"
        description="School history is optional, but you can add it manually here."
        onAdd={() => onEducationChange([...education, {}])}
      />
      {education.length === 0 ? (
        <EmptyState label="Education" />
      ) : (
        <div className="space-y-4">
          {education.map((item, index) => (
            <div
              key={`education-${index}`}
              className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  Education #{index + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    removeListItem(education, index, onEducationChange)
                  }
                  className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <OptionalFieldLabel>Degree</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.degree || ""}
                    onChange={(event) =>
                      updateListItem(
                        education,
                        index,
                        "degree",
                        event.target.value,
                        onEducationChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>Institution</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.institution || ""}
                    onChange={(event) =>
                      updateListItem(
                        education,
                        index,
                        "institution",
                        event.target.value,
                        onEducationChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>Location</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.location || ""}
                    onChange={(event) =>
                      updateListItem(
                        education,
                        index,
                        "location",
                        event.target.value,
                        onEducationChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>GPA</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.gpa || ""}
                    onChange={(event) =>
                      updateListItem(
                        education,
                        index,
                        "gpa",
                        event.target.value,
                        onEducationChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>Start date</OptionalFieldLabel>
                  <input
                    type="month"
                    value={item.startDate || ""}
                    onChange={(event) =>
                      updateListItem(
                        education,
                        index,
                        "startDate",
                        event.target.value,
                        onEducationChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>End date</OptionalFieldLabel>
                  <input
                    type="text"
                    placeholder="2025-06 or Present"
                    value={item.endDate || ""}
                    onChange={(event) =>
                      updateListItem(
                        education,
                        index,
                        "endDate",
                        event.target.value,
                        onEducationChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
              </div>
              <div className="mt-4">
                <OptionalFieldLabel>Description</OptionalFieldLabel>
                <textarea
                  value={item.description || ""}
                  onChange={(event) =>
                    updateListItem(
                      education,
                      index,
                      "description",
                      event.target.value,
                      onEducationChange,
                    )
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionHeader
        title="Certifications"
        description="Add certificates manually if you want them to appear with your profile."
        onAdd={() => onCertificationsChange([...certifications, {}])}
      />
      {certifications.length === 0 ? (
        <EmptyState label="Certifications" />
      ) : (
        <div className="space-y-4">
          {certifications.map((item, index) => (
            <div
              key={`certification-${index}`}
              className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  Certification #{index + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    removeListItem(
                      certifications,
                      index,
                      onCertificationsChange,
                    )
                  }
                  className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <OptionalFieldLabel>Name</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(event) =>
                      updateListItem(
                        certifications,
                        index,
                        "name",
                        event.target.value,
                        onCertificationsChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>Issuer</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.issuer || ""}
                    onChange={(event) =>
                      updateListItem(
                        certifications,
                        index,
                        "issuer",
                        event.target.value,
                        onCertificationsChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>Date</OptionalFieldLabel>
                  <input
                    type="month"
                    value={item.date || ""}
                    onChange={(event) =>
                      updateListItem(
                        certifications,
                        index,
                        "date",
                        event.target.value,
                        onCertificationsChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
              </div>
              <div className="mt-4">
                <OptionalFieldLabel>Description</OptionalFieldLabel>
                <textarea
                  value={item.description || ""}
                  onChange={(event) =>
                    updateListItem(
                      certifications,
                      index,
                      "description",
                      event.target.value,
                      onCertificationsChange,
                    )
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionHeader
        title="Projects"
        description="Share side projects, shipped work, or portfolio highlights."
        onAdd={() => onProjectsChange([...projects, {}])}
      />
      {projects.length === 0 ? (
        <EmptyState label="Projects" />
      ) : (
        <div className="space-y-4">
          {projects.map((item, index) => (
            <div
              key={`project-${index}`}
              className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  Project #{index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeListItem(projects, index, onProjectsChange)}
                  className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <OptionalFieldLabel>Name</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(event) =>
                      updateListItem(
                        projects,
                        index,
                        "name",
                        event.target.value,
                        onProjectsChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>Technologies</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.technologies || ""}
                    onChange={(event) =>
                      updateListItem(
                        projects,
                        index,
                        "technologies",
                        event.target.value,
                        onProjectsChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <OptionalFieldLabel>Project URL</OptionalFieldLabel>
                  <input
                    type="url"
                    value={item.url || ""}
                    onChange={(event) =>
                      updateListItem(
                        projects,
                        index,
                        "url",
                        event.target.value,
                        onProjectsChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
              </div>
              <div className="mt-4">
                <OptionalFieldLabel>Description</OptionalFieldLabel>
                <textarea
                  value={item.description || ""}
                  onChange={(event) =>
                    updateListItem(
                      projects,
                      index,
                      "description",
                      event.target.value,
                      onProjectsChange,
                    )
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionHeader
        title="Languages"
        description="Optional language skills can help with matching and admin review."
        onAdd={() => onLanguagesChange([...languages, {}])}
      />
      {languages.length === 0 ? (
        <EmptyState label="Languages" />
      ) : (
        <div className="space-y-4">
          {languages.map((item, index) => (
            <div
              key={`language-${index}`}
              className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  Language #{index + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    removeListItem(languages, index, onLanguagesChange)
                  }
                  className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <OptionalFieldLabel>Language</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.language || ""}
                    onChange={(event) =>
                      updateListItem(
                        languages,
                        index,
                        "language",
                        event.target.value,
                        onLanguagesChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <OptionalFieldLabel>Proficiency</OptionalFieldLabel>
                  <input
                    type="text"
                    value={item.proficiency || ""}
                    onChange={(event) =>
                      updateListItem(
                        languages,
                        index,
                        "proficiency",
                        event.target.value,
                        onLanguagesChange,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
