"use client";

import { ReactNode, useEffect, useState } from "react";
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
  "min-h-[120px] rounded-lg border-gray-200 text-sm focus:border-[#FFC905] focus:ring-[#FFC905]";

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

export function EditTalentModal({
  open,
  onOpenChange,
  talent,
  onSave,
}: EditTalentModalProps) {
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (talent) {
      setFormData({
        first_name: talent.first_name || "",
        last_name: talent.last_name || "",
        email: talent.email || "",
        title: talent.title || "",
        description: talent.description || "",
        country: talent.country || "",
        city: talent.city || "",
        phone_country_code: talent.phone_country_code || "",
        phone_number: talent.phone_number || "",
        about_work: talent.about_work || "",
        min_rate: talent.min_rate ?? talent.rate ?? undefined,
        max_rate: talent.max_rate ?? talent.rate ?? undefined,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!talent) return;

    try {
      setLoading(true);
      await onSave({ ...talent, ...formData } as ProfileData);
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
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Country</FieldLabel>
                    <Input
                      value={formData.country || ""}
                      onChange={(e) => setField("country", e.target.value)}
                      className={inputClassName}
                    />
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
                    value={formData.phone_country_code || ""}
                    onChange={(e) =>
                      setField("phone_country_code", e.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
                <div>
                  <FieldLabel>Phone Number</FieldLabel>
                  <Input
                    value={formData.phone_number || ""}
                    onChange={(e) => setField("phone_number", e.target.value)}
                    className={inputClassName}
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
                  />
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
