import {
  Briefcase,
  Calendar,
  CheckCircle,
  DollarSign,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Send,
  XCircle,
} from "lucide-react";
import { ProfileData } from "@/app/talents/my-profile/types";
import { Metadata } from "next";
import Link from "next/link";

import "@/app/styles/rich-text.css";
import { getProfileData } from "@/lib/fetch-profile-data";
import Image from "next/image";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { ActionHistory } from "@/app/components/admin/ActionHistory";
import SafeHTML from "@/app/components/SafeHTML";
import { formatRateRange } from "@/app/utils/format-rate-range";
import CvAdminManager from "./CvAdminManager";

export const metadata: Metadata = {
  title: "Admin Talent Management - GoodHive",
  description:
    "Admin interface for managing talent profiles, reviewing applications, and monitoring talent status in the GoodHive Web3 recruitment platform.",
  keywords:
    "admin talent management, talent profile review, Web3 talent admin, blockchain developer management, talent approval process",
};

type MyProfilePageProps = {
  params: {
    user_id: string;
  };
};

type AdminTalentProfile = ProfileData & {
  last_active?: string;
  website?: string | null;
};

export const revalidate = 0;

const cardClass = "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm";
const sectionLabelClass =
  "mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400";

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="break-words text-sm text-gray-700">{value}</p>
      </div>
    </div>
  );
}

export default async function Page(context: MyProfilePageProps) {
  const { user_id } = context.params;

  const user = (await getProfileData(user_id)) as AdminTalentProfile;

  const breadcrumbLabels = {
    [user_id]: `${user.first_name} ${user.last_name}`,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isApprovedTalent =
    user.talent_status === "approved" || user.approved === true;

  const skillList = String(user.skills || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <AdminPageLayout
      title={`${user.first_name} ${user.last_name}`}
      subtitle="Talent Profile"
      breadcrumbLabels={breadcrumbLabels}
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <div className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {user.image_url ? (
                  <Image
                    src={user.image_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    width={72}
                    height={72}
                    className="h-16 w-16 rounded-2xl object-cover sm:h-[72px] sm:w-[72px]"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFC905] text-xl font-bold text-black sm:h-[72px] sm:w-[72px]">
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {user.first_name} {user.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {user.title || "No title"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isApprovedTalent
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {isApprovedTalent ? "Approved" : "Pending Review"}
                  </span>
                </div>
                {user.country ? (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" />
                    {user.city ? `${user.city}, ` : ""}
                    {user.country}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <p className={sectionLabelClass}>About</p>
            <SafeHTML
              html={user.description || "<p>No description provided.</p>"}
              className="rich-text-content text-gray-700"
            />
          </div>

          {skillList.length > 0 ? (
            <div className={cardClass}>
              <p className={sectionLabelClass}>Skills</p>
              <div className="flex flex-wrap gap-2">
                {skillList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className={cardClass}>
            <p className={sectionLabelClass}>Work Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow
                icon={DollarSign}
                label="Rate"
                value={formatRateRange({
                  minRate: user.min_rate ?? user.rate,
                  maxRate: user.max_rate ?? user.rate,
                  currency: "$",
                  suffix: "/hr",
                })}
              />
              <DetailRow
                icon={Briefcase}
                label="Work Setup"
                value={
                  user.freelance_only
                    ? "Freelance only"
                    : "Open to multiple opportunity types"
                }
              />
              <DetailRow
                icon={Globe}
                label="Remote Preference"
                value={user.remote_only ? "Remote only" : "Open to on-site"}
              />
              <DetailRow
                icon={Calendar}
                label="Availability"
                value={user.availability ? "Available" : "Unavailable"}
              />
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Goals
              </p>
              <SafeHTML
                html={user.about_work || "<p>No work preferences provided.</p>"}
                className="rich-text-content text-gray-700"
              />
            </div>
          </div>

          <div className={cardClass}>
            <p className={sectionLabelClass}>CV</p>
            <CvAdminManager
              userId={user_id}
              initialCvUrl={user.cv_url}
              isApproved={isApprovedTalent}
            />
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className={cardClass}>
            <p className={sectionLabelClass}>Actions</p>
            <div className="space-y-2">
              {!isApprovedTalent ? (
                <Link href="/admin/talent-approval" className="block">
                  <span className="flex w-full items-center gap-2 rounded-xl bg-[rgba(255,201,5,0.12)] px-4 py-2.5 text-sm font-semibold text-[#8a6d00] transition-colors hover:bg-[rgba(255,201,5,0.2)]">
                    <CheckCircle className="h-4 w-4" />
                    Approve Talent
                  </span>
                </Link>
              ) : null}
              <Link href="/admin/talent-approval" className="block">
                <span className="flex w-full items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100">
                  <XCircle className="h-4 w-4" />
                  Reject
                </span>
              </Link>
              <Link href="/admin/talents" className="block">
                <span className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100">
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </span>
              </Link>
            </div>
          </div>

          <div className={cardClass}>
            <p className={sectionLabelClass}>Contact Info</p>
            <div className="space-y-4">
              <DetailRow icon={Mail} label="Email" value={user.email} />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={`${user.phone_country_code || ""}${user.phone_number || ""}` || "Not provided"}
              />
              {user.linkedin ? (
                <DetailRow icon={Linkedin} label="LinkedIn" value={user.linkedin} />
              ) : null}
              {user.telegram ? (
                <DetailRow icon={Send} label="Telegram" value={`@${user.telegram}`} />
              ) : null}
              {user.portfolio || user.website ? (
                <DetailRow
                  icon={Globe}
                  label="Portfolio"
                  value={user.portfolio || user.website || ""}
                />
              ) : null}
              <DetailRow
                icon={Calendar}
                label="Last Active"
                value={formatDate(user.last_active || new Date().toISOString())}
              />
            </div>
          </div>

          <div className={cardClass}>
            <p className={sectionLabelClass}>Action History</p>
            <ActionHistory targetType="talent" targetId={user_id} />
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
