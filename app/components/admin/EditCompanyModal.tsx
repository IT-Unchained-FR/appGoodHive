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
import toast from "react-hot-toast";
import { Building2 } from "lucide-react";

export interface Company {
  user_id: string;
  designation: string;
  email: string;
  phone_country_code: string;
  phone_number: string;
  address: string;
  city: string;
  country: string;
  headline: string;
  approved: boolean;
  published: boolean;
  inreview: boolean;
  status: string;
  image_url: string;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  telegram: string;
  portfolio: string | null;
  stackoverflow: string | null;
  wallet_address: string | null;
}

interface EditCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSave: (company: Company) => Promise<void>;
}

type CompanyStatusKey = "approved" | "published" | "inreview";

const inputClassName = "h-10 rounded-lg border-gray-200 text-sm";
const labelClassName = "mb-1 block text-xs font-medium text-gray-500";

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

export function EditCompanyModal({
  open,
  onOpenChange,
  company,
  onSave,
}: EditCompanyModalProps) {
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const setField = <K extends keyof Company>(key: K, value: Company[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      setLoading(true);
      await onSave({ ...company, ...formData } as Company);
      toast.success("Company updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update company");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  const statusRows: Array<{
    id: CompanyStatusKey;
    label: string;
    desc: string;
  }> = [
    {
      id: "approved",
      label: "Approved",
      desc: "Company profile has passed admin approval",
    },
    {
      id: "published",
      label: "Published",
      desc: "Company is visible across the platform",
    },
    {
      id: "inreview",
      label: "In Review",
      desc: "Company is still under manual review",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <form onSubmit={handleSubmit} className="space-y-0">
          <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 pb-4 pt-6">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <DialogTitle className="text-base font-bold text-gray-900">
                Edit Company
              </DialogTitle>
            </div>
            <p className="ml-11 text-xs text-gray-400">
              {company.designation} · {company.email}
            </p>
          </div>

          <div className="space-y-6 px-6 py-5">
            <div>
              <SectionHeading>Company Information</SectionHeading>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Designation</FieldLabel>
                    <Input
                      value={formData.designation || ""}
                      onChange={(e) => setField("designation", e.target.value)}
                      className={inputClassName}
                      required
                    />
                  </div>
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
                </div>
                <div>
                  <FieldLabel>Headline</FieldLabel>
                  <Input
                    value={formData.headline || ""}
                    onChange={(e) => setField("headline", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <FieldLabel>Address</FieldLabel>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) => setField("address", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>City</FieldLabel>
                    <Input
                      value={formData.city || ""}
                      onChange={(e) => setField("city", e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <FieldLabel>Country</FieldLabel>
                    <Input
                      value={formData.country || ""}
                      onChange={(e) => setField("country", e.target.value)}
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
                  <FieldLabel>Telegram</FieldLabel>
                  <Input
                    value={formData.telegram || ""}
                    onChange={(e) => setField("telegram", e.target.value)}
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
                  <FieldLabel>StackOverflow</FieldLabel>
                  <Input
                    value={formData.stackoverflow || ""}
                    onChange={(e) => setField("stackoverflow", e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Wallet Address</FieldLabel>
                  <Input
                    value={formData.wallet_address || ""}
                    onChange={(e) => setField("wallet_address", e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            <div>
              <SectionHeading>Status</SectionHeading>
              <div className="divide-y divide-gray-100 rounded-xl bg-gray-50">
                {statusRows.map(({ id, label, desc }) => (
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
