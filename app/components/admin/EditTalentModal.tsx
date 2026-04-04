"use client";

import { ReactNode, useEffect, useState } from "react";
import { countries } from "@/app/constants/countries";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { UserCheck } from "lucide-react";
import { ProfileData } from "@/app/talents/my-profile/page";

interface EditTalentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: ProfileData | null;
  onSave: (talent: ProfileData) => Promise<void>;
}

type RoleToggleKey = "approved" | "talent" | "mentor" | "recruiter";
type PreferenceToggleKey = "freelance_only" | "remote_only";

const inputClassName = "h-10 rounded-lg border-gray-200 text-sm";
const labelClassName = "mb-1 block text-xs font-medium text-gray-500";
const textareaClassName =
  "min-h-[140px] rounded-lg border-gray-200 text-sm focus:border-[#FFC905] focus:ring-[#FFC905]";

type CountryOption = {
  value: string;
  label: string;
  phoneCode: string;
};

const countryOptions = countries as CountryOption[];

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className={labelClassName}>{children}</label>;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
      {children}
    </p>
  );
}

function decodeHtmlEntities(value: string) {
  if (typeof window === "undefined") {
    return value
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function htmlToEditorText(value: string | null | undefined) {
  if (!value) return "";

  return decodeHtmlEntities(
    value
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<li>/gi, "• ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\u00a0/g, " "),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function editorTextToHtml(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function normalizePhoneCode(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function findCountryOption(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  return (
    countryOptions.find(
      (country) =>
        country.value.toLowerCase() === normalized ||
        country.label.toLowerCase() === normalized,
    ) || null
  );
}

export function EditTalentModal({
  open,
  onOpenChange,
  talent,
  onSave,
}: EditTalentModalProps) {
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [loading, setLoading] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");

  useEffect(() => {
    if (talent) {
      const matchedCountry = findCountryOption(talent.country || "");
      const resolvedCountry = matchedCountry?.value || talent.country || "";
      const resolvedPhoneCode =
        matchedCountry?.phoneCode || normalizePhoneCode(talent.phone_country_code);

      setCountryQuery(matchedCountry?.label || talent.country || "");
      setFormData({
        first_name: talent.first_name || "",
        last_name: talent.last_name || "",
        email: talent.email || "",
        title: talent.title || "",
        description: htmlToEditorText(talent.description),
        country: resolvedCountry,
        city: talent.city || "",
        phone_country_code: resolvedPhoneCode,
        phone_number: talent.phone_number || "",
        about_work: htmlToEditorText(talent.about_work),
        min_rate: normalizeOptionalNumber(talent.min_rate ?? talent.rate),
        max_rate: normalizeOptionalNumber(talent.max_rate ?? talent.rate),
        freelance_only: talent.freelance_only || false,
        remote_only: talent.remote_only || false,
        skills: talent.skills || "",
        linkedin: talent.linkedin || "",
        github: talent.github || "",
        twitter: talent.twitter || "",
        stackoverflow: talent.stackoverflow || "",
        portfolio: talent.portfolio || "",
        telegram: talent.telegram || "",
        approved: talent.approved || false,
        talent: talent.talent || false,
        mentor: talent.mentor || false,
        recruiter: talent.recruiter || false,
      });
    }
  }, [talent]);

  const setField = <K extends keyof ProfileData>(
    key: K,
    value: ProfileData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCountryChange = (value: string) => {
    setCountryQuery(value);

    const match = findCountryOption(value);
    if (match) {
      setFormData((prev) => ({
        ...prev,
        country: match.value,
        phone_country_code: match.phoneCode,
      }));
      return;
    }

    if (!value.trim()) {
      setFormData((prev) => ({
        ...prev,
        country: "",
        phone_country_code: "",
      }));
    }
  };

  const handleCountryBlur = () => {
    const match = findCountryOption(countryQuery);
    if (match) {
      setCountryQuery(match.label);
      setFormData((prev) => ({
        ...prev,
        country: match.value,
        phone_country_code: match.phoneCode,
      }));
      return;
    }

    if (!countryQuery.trim()) {
      setCountryQuery("");
      setFormData((prev) => ({
        ...prev,
        country: "",
        phone_country_code: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!talent) return;

    try {
      setLoading(true);
      const matchedCountry = findCountryOption(countryQuery);

      await onSave({
        ...talent,
        ...formData,
        country: matchedCountry?.value || (formData.country || ""),
        phone_country_code:
          matchedCountry?.phoneCode ||
          normalizePhoneCode(formData.phone_country_code),
        phone_number: formData.phone_number?.trim() || "",
        description: editorTextToHtml(formData.description),
        about_work: editorTextToHtml(formData.about_work),
      } as ProfileData);
      toast.success("Talent updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update talent");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!talent) return null;

  const roleRows: Array<{
    id: RoleToggleKey;
    label: string;
    desc: string;
  }> = [
    {
      id: "approved",
      label: "Approved Status",
      desc: "User has been approved on the platform",
    },
    {
      id: "talent",
      label: "Talent Role",
      desc: "Can apply for jobs as a talent",
    },
    {
      id: "mentor",
      label: "Mentor Role",
      desc: "Can mentor other users",
    },
    {
      id: "recruiter",
      label: "Recruiter Role",
      desc: "Can post and manage job listings",
    },
  ];

  const preferenceRows: Array<{
    id: PreferenceToggleKey;
    label: string;
    desc: string;
  }> = [
    {
      id: "freelance_only",
      label: "Freelance Only",
      desc: "Only accepts freelance engagements",
    },
    {
      id: "remote_only",
      label: "Remote Only",
      desc: "Prefers remote opportunities",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <form onSubmit={handleSubmit} className="space-y-0">
          <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 pb-4 pt-6">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <UserCheck className="h-4 w-4 text-blue-600" />
              </div>
              <DialogTitle className="text-base font-bold text-gray-900">
                Edit Talent
              </DialogTitle>
            </div>
            <p className="ml-11 text-xs text-gray-400">
              {talent.first_name} {talent.last_name} · {talent.email}
            </p>
          </div>

          <div className="space-y-6 px-6 py-5">
            <div>
              <SectionHeading>Personal Information</SectionHeading>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>First Name</FieldLabel>
                    <Input
                      value={formData.first_name || ""}
                      onChange={(e) => setField("first_name", e.target.value)}
                      className={inputClassName}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel>Last Name</FieldLabel>
                    <Input
                      value={formData.last_name || ""}
                      onChange={(e) => setField("last_name", e.target.value)}
                      className={inputClassName}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setField("email", e.target.value)}
                      className={inputClassName}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel>Title</FieldLabel>
                    <Input
                      value={formData.title || ""}
                      onChange={(e) => setField("title", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setField("description", e.target.value)}
                    className={textareaClassName}
                    placeholder="Short professional summary. Plain text is fine; line breaks will be preserved."
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Existing HTML formatting is flattened here for cleaner editing.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Country</FieldLabel>
                    <Input
                      list="admin-talent-country-options"
                      value={countryQuery}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      onBlur={handleCountryBlur}
                      className={inputClassName}
                      placeholder="Start typing a country"
                    />
                    <datalist id="admin-talent-country-options">
                      {countryOptions.map((country) => (
                        <option key={country.value} value={country.label} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-xs text-gray-400">
                      Select a country to keep location and dialing code consistent.
                    </p>
                  </div>
                  <div>
                    <FieldLabel>City</FieldLabel>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) => setField("city", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeading>Contact</SectionHeading>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Phone Country Code</FieldLabel>
                  <Input
                    value={normalizePhoneCode(formData.phone_country_code)}
                    className={`${inputClassName} bg-gray-50 text-gray-500`}
                    placeholder="Select a country first"
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Auto-filled from the country selection.
                  </p>
                </div>
                <div>
                  <FieldLabel>Phone Number</FieldLabel>
                  <Input
                    value={formData.phone_number || ""}
                    onChange={(e) => setField("phone_number", e.target.value)}
                    className={inputClassName}
                    placeholder="Digits only"
                  />
                </div>
              </div>
            </div>

            <div>
              <SectionHeading>Professional</SectionHeading>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Min Rate</FieldLabel>
                    <Input
                      type="number"
                      value={formData.min_rate ?? ""}
                      onChange={(e) =>
                        setField(
                          "min_rate",
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <FieldLabel>Max Rate</FieldLabel>
                    <Input
                      type="number"
                      value={formData.max_rate ?? ""}
                      onChange={(e) =>
                        setField(
                          "max_rate",
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                      className={inputClassName}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Skills</FieldLabel>
                  <Input
                    value={formData.skills || ""}
                    onChange={(e) => setField("skills", e.target.value)}
                    className={inputClassName}
                    placeholder="Comma-separated skills"
                  />
                </div>
                <div>
                  <FieldLabel>About Work</FieldLabel>
                  <Textarea
                    value={formData.about_work || ""}
                    onChange={(e) => setField("about_work", e.target.value)}
                    className={textareaClassName}
                    placeholder="Describe the kind of work this talent is looking for, strengths, and preferences."
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Use plain text. Paragraphs will be saved cleanly.
                  </p>
                </div>
                <div className="divide-y divide-gray-100 rounded-xl bg-gray-50">
                  {preferenceRows.map(({ id, label, desc }) => (
                    <div
                      key={id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {label}
                        </p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                      <Switch
                        checked={(formData[id] as boolean | undefined) || false}
                        onCheckedChange={(checked) => setField(id, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <SectionHeading>Social Links</SectionHeading>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>LinkedIn</FieldLabel>
                  <Input
                    value={formData.linkedin || ""}
                    onChange={(e) => setField("linkedin", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <FieldLabel>GitHub</FieldLabel>
                  <Input
                    value={formData.github || ""}
                    onChange={(e) => setField("github", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <FieldLabel>Twitter</FieldLabel>
                  <Input
                    value={formData.twitter || ""}
                    onChange={(e) => setField("twitter", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <FieldLabel>Portfolio</FieldLabel>
                  <Input
                    value={formData.portfolio || ""}
                    onChange={(e) => setField("portfolio", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <FieldLabel>Telegram</FieldLabel>
                  <Input
                    value={formData.telegram || ""}
                    onChange={(e) => setField("telegram", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <FieldLabel>StackOverflow</FieldLabel>
                  <Input
                    value={formData.stackoverflow || ""}
                    onChange={(e) => setField("stackoverflow", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            <div>
              <SectionHeading>Roles &amp; Status</SectionHeading>
              <div className="divide-y divide-gray-100 rounded-xl bg-gray-50">
                {roleRows.map(({ id, label, desc }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {label}
                      </p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                    <Switch
                      checked={(formData[id] as boolean | undefined) || false}
                      onCheckedChange={(checked) => setField(id, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white px-6 pb-6 pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 flex-1 rounded-xl bg-[#FFC905] font-semibold text-black hover:bg-[#e6b400]"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
