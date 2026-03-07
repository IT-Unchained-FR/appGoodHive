"use client";

import { AutoSuggestInput } from "@/app/components/autosuggest-input";
import { AvailabilityToggle } from "@/app/components/AvailabilityToggle";
import ProfileImageUpload from "@/app/components/profile-image-upload";
import { ReferralSection } from "@/app/components/referral/referral-section";
import { SearchableSelectInput } from "@/app/components/searchable-select-input";
import { HoneybeeSpinner } from "@/app/components/spinners/honey-bee-spinner/honey-bee-spinner";
import { ResumeStructuredSections } from "@/app/components/talents/ResumeStructuredSections";
import { ToggleButton } from "@/app/components/toggle-button";
import { createJobServices } from "@/app/constants/common";
import { countries } from "@/app/constants/countries";
import { skills } from "@/app/constants/skills";
import { useAuthCheck } from "@/app/hooks/useAuthCheck";
import { useCurrentUserId } from "@/app/hooks/useCurrentUserId";
import "@/app/styles/rich-text.css";
import { uploadFileToBucket } from "@/app/utils/upload-file-bucket";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CircleCheckBig,
  Eye,
  FileText,
  Globe,
  Layers3,
  Save,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import "react-quill/dist/quill.snow.css";
import type {
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
  ResumeProject,
} from "@/lib/talent-profile/resume-data";
import { resumeUploadSizeLimit } from "./constants";
import { socialLinks } from "./constant";
import { PDFImportModal } from "./pdf-import-modal";
import { SocialLink } from "./social-link";
import "./profile-redesign.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

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
  min_rate?: number;
  max_rate?: number;
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
  availability?: boolean | string;
  wallet_address?: string;
  approved: boolean;
  user_id?: string;
  inreview?: boolean;
  referred_by?: string;
  approved_roles?: object[];
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  certifications?: ResumeCertification[];
  projects?: ResumeProject[];
  languages?: ResumeLanguage[];
  current_company?: string;
  user_created_at?: string;
  created_at?: string;
  years_experience?: number;
};

type RoleKey = "talent" | "mentor" | "recruiter";

type UserRoleStatus = {
  talent_status?: string | null;
  mentor_status?: string | null;
  recruiter_status?: string | null;
  talent_status_reason?: string | null;
  mentor_status_reason?: string | null;
  recruiter_status_reason?: string | null;
};

const ROLE_CONFIG: Array<{
  key: RoleKey;
  label: string;
  statusKey: keyof UserRoleStatus;
  reasonKey: keyof UserRoleStatus;
}> = [
  {
    key: "talent",
    label: "Talent",
    statusKey: "talent_status",
    reasonKey: "talent_status_reason",
  },
  {
    key: "mentor",
    label: "Mentor",
    statusKey: "mentor_status",
    reasonKey: "mentor_status_reason",
  },
  {
    key: "recruiter",
    label: "Recruiter",
    statusKey: "recruiter_status",
    reasonKey: "recruiter_status_reason",
  },
];

const PROFILE_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    description: "Identity and status",
  },
  {
    id: "public-intro",
    label: "Intro",
    description: "Public summary",
  },
  {
    id: "personal-details",
    label: "Details",
    description: "Contact and location",
  },
  {
    id: "work-preferences",
    label: "Preferences",
    description: "Rates and setup",
  },
  {
    id: "about-work",
    label: "Goals",
    description: "Your next move",
  },
  {
    id: "resume-imports",
    label: "Resume",
    description: "CV and AI import",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Expertise tags",
  },
  {
    id: "social-presence",
    label: "Links",
    description: "Verified profiles",
  },
  {
    id: "referral",
    label: "Referral",
    description: "Invite details",
  },
] as const;

type ProfileSectionId = (typeof PROFILE_SECTIONS)[number]["id"];

const PROFILE_CHAPTERS = [
  {
    id: "foundation",
    label: "Foundation",
    description: "Identity, intro, and contact details",
    sections: ["overview", "public-intro", "personal-details"],
  },
  {
    id: "opportunities",
    label: "Opportunities",
    description: "Work setup, goals, and availability",
    sections: ["work-preferences", "about-work"],
  },
  {
    id: "proof",
    label: "Proof",
    description: "Resume, skills, and credibility links",
    sections: ["resume-imports", "skills", "social-presence"],
  },
  {
    id: "Extras",
    label: "Extras",
    description: "Referral details and finishing touches",
    sections: ["referral"],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  sections: readonly ProfileSectionId[];
}>;

type ProfileChapter = (typeof PROFILE_CHAPTERS)[number];

const chapterHasSection = (
  chapter: ProfileChapter,
  sectionId: ProfileSectionId,
) => (chapter.sections as readonly ProfileSectionId[]).includes(sectionId);

const getChapterStartSection = (chapter: ProfileChapter) =>
  chapter.sections[0] as ProfileSectionId;

const REQUIRED_COMPLETION_KEYS = [
  "title",
  "first_name",
  "last_name",
  "country",
  "city",
  "phone_number",
  "email",
  "telegram",
] as const;

const ERROR_SECTION_MAP: Record<string, ProfileSectionId> = {
  title: "overview",
  description: "public-intro",
  first_name: "personal-details",
  last_name: "personal-details",
  country: "personal-details",
  city: "personal-details",
  phone_country_code: "personal-details",
  phone_number: "personal-details",
  email: "personal-details",
  min_rate: "work-preferences",
  max_rate: "work-preferences",
  role: "work-preferences",
  about_work: "about-work",
  cv_url: "resume-imports",
  skills: "skills",
  telegram: "social-presence",
};

function decodeBase64HtmlWrappedInPTags(str: string) {
  if (!str || typeof str !== "string") return "";
  if (str.trim() === "") return "";

  const match = str.match(/^<p>([A-Za-z0-9+/=\s]+)<\/p>$/);
  if (match) {
    try {
      const base64 = match[1].replace(/\s/g, "");
      const decoded = atob(base64);
      if (/<[a-z][\s\S]*>/i.test(decoded)) {
        return decoded;
      }
      return base64;
    } catch (e) {
      return str;
    }
  }
  return str;
}

function stripHtmlLength(value?: string) {
  return value?.replace(/<[^>]*>/g, "").trim().length ?? 0;
}

function SectionCard({
  id,
  eyebrow,
  title,
  description,
  children,
  isActive = true,
  bodyClassName,
}: {
  id: ProfileSectionId;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  isActive?: boolean;
  bodyClassName?: string;
}) {
  return (
    <section
      id={id}
      data-section-active={isActive ? "true" : "false"}
      className={`gh-section-anchor gh-profile-card overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur ${
        isActive ? "block" : "hidden"
      }`}
    >
      <div className="border-b border-slate-200/80 px-5 py-5 sm:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      <div
        className={`gh-section-body px-5 py-5 sm:px-7 sm:py-6 ${bodyClassName || ""}`.trim()}
      >
        {children}
      </div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-800"
    >
      <span>{children}</span>
      {required && <span className="text-orange-500">*</span>}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs leading-5 text-slate-500">{children}</p>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm font-medium text-red-500">{message}</p>;
}

function StatusBanner({ profileData }: { profileData: ProfileData }) {
  const isApprovedProfile = Boolean(profileData?.approved);
  const isUnderReview = profileData.inreview === true;

  if (!isApprovedProfile && !isUnderReview) return null;

  return (
    <div
      className={`rounded-3xl border px-5 py-4 shadow-sm ${
        isUnderReview
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
            isUnderReview ? "bg-amber-100" : "bg-emerald-100"
          }`}
        >
          {isUnderReview ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <CircleCheckBig className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">
            {isUnderReview ? "Profile submitted" : "Profile approved"}
          </p>
          <p className="mt-1 text-sm leading-6">
            {isUnderReview
              ? "Your profile has been submitted and is currently under review. Role toggles are locked until the review is complete."
              : "Your profile is approved. You can edit details and save updates anytime."}
          </p>
        </div>
      </div>
    </div>
  );
}

function RejectionBanner({
  rejectedRoles,
}: {
  rejectedRoles: Array<{ label: string; reason?: string | null }>;
}) {
  if (!rejectedRoles.length) return null;

  const uniqueReasons = Array.from(
    new Set(
      rejectedRoles
        .map((role) => role.reason?.trim())
        .filter((reason): reason is string => Boolean(reason)),
    ),
  );

  return (
    <div className="mt-4 rounded-3xl border border-rose-200 bg-[linear-gradient(180deg,_#fff5f5_0%,_#fff1f2_100%)] px-5 py-4 shadow-[0_14px_30px_rgba(244,63,94,0.08)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <BadgeCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rose-900">
            Profile review update
          </p>
          <p className="mt-1 text-sm leading-6 text-rose-800">
            {`${
              rejectedRoles.map((role) => role.label).join(", ")
            } ${rejectedRoles.length > 1 ? "were" : "was"} not approved.`}
            {" "}You can update and resubmit when ready.
          </p>
          {uniqueReasons.length > 0 && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-white/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-600">
                Admin Feedback
              </p>
              <p className="mt-2 text-sm leading-6 text-rose-900">
                {uniqueReasons.join(" ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const isInitialMount = useRef(true);
  const isMounted = useRef(false);
  const router = useRouter();
  const user_id = useCurrentUserId();
  const { checkAuthAndShowConnectPrompt } = useAuthCheck();

  const [isProfileDataFetching, setIsProfileDataFetching] = useState(false);
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);
  const [reviewProfileLoading, setReviewProfileLoading] = useState(false);
  const [isTokenVerifying, setIsTokenVerifying] = useState(true);
  const [activeSection, setActiveSection] =
    useState<ProfileSectionId>("overview");

  useEffect(() => {
    const verifyToken = async () => {
      if (!user_id) {
        checkAuthAndShowConnectPrompt("access your profile");
        setIsTokenVerifying(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          checkAuthAndShowConnectPrompt("access your profile");
          setIsTokenVerifying(false);
          return;
        }

        const data = await response.json();

        if (data.user_id !== user_id) {
          checkAuthAndShowConnectPrompt("access your profile");
          setIsTokenVerifying(false);
          return;
        }

        setIsTokenVerifying(false);
      } catch (error) {
        console.error("Error verifying token:", error);
        checkAuthAndShowConnectPrompt("access your profile");
        setIsTokenVerifying(false);
      }
    };

    void verifyToken();
  }, [checkAuthAndShowConnectPrompt, user_id]);

  const [profileData, setProfileData] = useState<ProfileData>(
    {} as ProfileData,
  );
  const [user, setUser] = useState<UserRoleStatus | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploadedCvLink, setIsUploadedCvLink] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [descriptionContent, setDescriptionContent] = useState("");
  const [aboutWorkContent, setAboutWorkContent] = useState("");
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isPDFImporting, setIsPDFImporting] = useState(false);

  const isProfileInReview = useMemo(
    () => profileData.inreview === true,
    [profileData.inreview],
  );

  const isApprovedProfile = useMemo(
    () => Boolean(profileData?.approved),
    [profileData?.approved],
  );
  const selectedRoleMeta = useMemo(
    () =>
      ROLE_CONFIG.filter((roleConfig) =>
        Boolean(profileData[roleConfig.key as keyof ProfileData]),
      ).map((roleConfig) => ({
        key: roleConfig.key,
        label: roleConfig.label,
        status: (user?.[roleConfig.statusKey] as string | null | undefined) || null,
        reason: (user?.[roleConfig.reasonKey] as string | null | undefined) || null,
      })),
    [profileData, user],
  );
  const unapprovedSelectedRoles = useMemo(
    () =>
      selectedRoleMeta.filter(
        (role) => role.status !== "approved",
      ),
    [selectedRoleMeta],
  );
  const rejectedSelectedRoles = useMemo(
    () =>
      selectedRoleMeta.filter(
        (role) => role.status === "rejected" || role.status === "deferred",
      ),
    [selectedRoleMeta],
  );
  const canShowSubmitAction = useMemo(
    () => !isProfileInReview && (!isApprovedProfile || unapprovedSelectedRoles.length > 0),
    [isApprovedProfile, isProfileInReview, unapprovedSelectedRoles.length],
  );

  const fetchProfile = useCallback(async () => {
    if (!user_id) return;

    try {
      setIsProfileDataFetching(true);
      const response = await fetch(
        `/api/talents/my-profile?user_id=${user_id}`,
      );

        if (response.ok) {
          const data = await response.json();
          setProfileData(data);

          if (isInitialMount.current) {
            if (data.country) {
              const matchedCountry =
                countries.find((country) => country.value === data.country) ||
                countries.find((country) =>
                  country.value.toLowerCase().includes(data.country.toLowerCase()),
                );
              setSelectedCountry(
                matchedCountry || { value: data.country, label: data.country },
              );
            }
          if (data.skills) {
            setSelectedSkills(data.skills.split(","));
          }
          setDescriptionContent(
            decodeBase64HtmlWrappedInPTags(data.description || ""),
          );
          setAboutWorkContent(
            decodeBase64HtmlWrappedInPTags(data.about_work || ""),
          );
          isInitialMount.current = false;
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsProfileDataFetching(false);
    }
  }, [user_id]);

  const fetchUser = useCallback(async () => {
    if (!user_id) return;

    try {
      const response = await fetch(`/api/profile?user_id=${user_id}`);
      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }, [user_id]);

  useEffect(() => {
    if (!user_id) return;

    const initializeData = async () => {
      await Promise.all([fetchProfile(), fetchUser()]);
    };

    void initializeData();
    isMounted.current = true;
  }, [user_id, fetchProfile, fetchUser]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const activeBody = document.querySelector<HTMLElement>(
      '[data-section-active="true"] .gh-section-body',
    );
    activeBody?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  const getFirstErrorSection = useCallback(
    (validationErrors: { [key: string]: string }) => {
      for (const key of Object.keys(validationErrors)) {
        const section = ERROR_SECTION_MAP[key];
        if (section) {
          return section;
        }
      }
      return null;
    },
    [],
  );

  const validateForm = useCallback(
    (
      data: ProfileData,
      requireAll: boolean,
    ): { isValid: boolean; firstErrorSection: ProfileSectionId | null } => {
      if (!requireAll) {
        return { isValid: true, firstErrorSection: null };
      }

      const requiredFields = {
        title: "Profile header",
        description: "Profile description",
        first_name: "First name",
        last_name: "Last name",
        country: "Country",
        city: "City",
        phone_country_code: "Phone country code",
        phone_number: "Phone number",
        email: "Email",
        about_work: "About work",
        telegram: "Telegram",
      };

      const newErrors: { [key: string]: string } = {};

      Object.entries(requiredFields).forEach(([key, label]) => {
        if (!data[key as keyof ProfileData]) {
          newErrors[key] = `${label} is required`;
        }
      });

      if (!selectedSkills.length) {
        newErrors.skills = "Skills are required";
      }

      const minRate = data.min_rate;
      const maxRate = data.max_rate;
      const hasMinRate = minRate !== undefined && minRate !== null;
      const hasMaxRate = maxRate !== undefined && maxRate !== null;

      if (!hasMinRate || !hasMaxRate) {
        newErrors.min_rate = "Hourly rate range is required";
        newErrors.max_rate = "Hourly rate range is required";
      } else if (hasMinRate && hasMaxRate && Number(minRate) > Number(maxRate)) {
        newErrors.max_rate = "Maximum rate must be at least minimum rate";
      }

      if (!data.talent && !data.mentor && !data.recruiter) {
        newErrors.role = "Select at least one role";
      }

      if (requireAll && !data.cv_url && !cvFile) {
        newErrors.cv_url = "Please upload your CV";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return {
          isValid: false,
          firstErrorSection: getFirstErrorSection(newErrors),
        };
      }

      setErrors({});
      return { isValid: true, firstErrorSection: null };
    },
    [selectedSkills, cvFile, getFirstErrorSection],
  );

  const handleFormSubmit = useCallback(
    async (validate: boolean) => {
      try {
        if (validate) {
          setReviewProfileLoading(true);
        } else {
          setSaveProfileLoading(true);
        }

        const validationResult = validateForm(profileData, validate);
        if (!validationResult.isValid) {
          if (validationResult.firstErrorSection) {
            goToSection(validationResult.firstErrorSection);
            const sectionLabel =
              PROFILE_SECTIONS.find(
                (section) => section.id === validationResult.firstErrorSection,
              )?.label || "the form";
            toast.error(`Please complete required fields in ${sectionLabel}.`);
          } else {
            toast.error("Please fill in all required fields");
          }
          setSaveProfileLoading(false);
          setReviewProfileLoading(false);
          return;
        }

        let imageUrl = profileData.image_url;
        let cvUrl = profileData.cv_url;

        if (profileImage) {
          imageUrl = (await uploadFileToBucket(profileImage)) as string;
        }

        if (cvFile) {
          cvUrl = (await uploadFileToBucket(cvFile)) as string;
        }

        const formData = {
          ...profileData,
          country: selectedCountry?.value,
          phone_country_code: selectedCountry?.phoneCode,
          skills: selectedSkills.join(","),
          image_url: imageUrl,
          cv_url: cvUrl,
          wallet_address: walletAddress,
          user_id,
          experience: profileData.experience || [],
          education: profileData.education || [],
          certifications: profileData.certifications || [],
          projects: profileData.projects || [],
          languages: profileData.languages || [],
        };

        if (user?.referred_by) {
          formData.referred_by = user.referred_by;
        }

        const profileResponse = await fetch("/api/talents/my-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, validate }),
        });

        if (profileResponse.ok) {
          if (validate) {
            try {
              await fetch("/api/send-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: formData.email,
                  type: "new-talent",
                  subject: `Welcome to GoodHive, ${formData.first_name}! 🎉 Your profile has been sent for review`,
                  toUserName: `${formData.first_name} ${formData.last_name}`,
                }),
              });
            } catch (error) {
              console.error("Error sending email:", error);
            }
          }

          toast.success(
            validate
              ? "Profile sent to review by the core team!"
              : "Profile saved successfully",
          );
          void fetchProfile();
        } else {
          const profileSavingErrorData = await profileResponse.json();
          toast.error(profileSavingErrorData.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong while saving your profile");
      } finally {
        setSaveProfileLoading(false);
        setReviewProfileLoading(false);
      }
    },
    [
      cvFile,
      fetchProfile,
      profileData,
      profileImage,
      selectedCountry,
      selectedSkills,
      user,
      user_id,
      validateForm,
      walletAddress,
      goToSection,
    ],
  );

  const handleSaveProfile = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      void handleFormSubmit(false);
    },
    [handleFormSubmit],
  );

  const handleSendForReview = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      void handleFormSubmit(true);
    },
    [handleFormSubmit],
  );

  const handleCvFileChange = useCallback((file: File | null) => {
    if (!file) return;

    if (file.size > 1024 * 1024 * Number(resumeUploadSizeLimit)) {
      toast.error(`File size should be less than ${resumeUploadSizeLimit} MB`);
      return;
    }

    setCvFile(file);
  }, []);

  const onCvInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      handleCvFileChange(event.target.files[0]);
    },
    [handleCvFileChange],
  );

  const handleCountryChange = useCallback((country: any) => {
    if (!country) return;

    setSelectedCountry(country);
    setProfileData((prev) => ({
      ...prev,
      country: country?.value,
      phone_country_code: country?.phoneCode,
    }));
  }, []);

  const handleSkillsChange = useCallback(
    (nextSkills: string[]) => {
      setSelectedSkills(nextSkills);
      setProfileData((prev) => ({
        ...prev,
        skills: nextSkills.join(","),
      }));

      if (nextSkills.length > 0 && errors.skills) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.skills;
          return updated;
        });
      }
    },
    [errors.skills],
  );

  const handleInputChange = useCallback((name: string, value: any) => {
    if (isMounted.current) {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }, []);

  const handleToggleChange = useCallback((name: string, checked: boolean) => {
    setProfileData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }, []);

  const handlePDFImportSuccess = async (
    generatedData: any,
    resumeFile: File,
  ) => {
    try {
      setIsPDFImporting(true);
      let uploadedCvUrl: string | null = null;

      try {
        uploadedCvUrl = (await uploadFileToBucket(resumeFile)) as string;
      } catch (uploadError) {
        console.error(
          "Error auto-uploading resume during AI import:",
          uploadError,
        );
        setCvFile(resumeFile);
        toast.error(
          "Profile data generated, but resume auto-upload failed. Saving profile will retry upload.",
        );
      }

      setProfileData((prev) => ({
        ...prev,
        first_name: generatedData.first_name || prev.first_name,
        last_name: generatedData.last_name || prev.last_name,
        title: generatedData.title || prev.title,
        description: generatedData.description || prev.description,
        email: generatedData.email || prev.email,
        phone_number: generatedData.phone_number || prev.phone_number,
        phone_country_code:
          generatedData.phone_country_code || prev.phone_country_code,
        country: generatedData.country || prev.country,
        city: generatedData.city || prev.city,
        about_work: generatedData.about_work || prev.about_work,
        linkedin: generatedData.linkedin || prev.linkedin,
        github: generatedData.github || prev.github,
        portfolio: generatedData.portfolio || prev.portfolio,
        experience: generatedData.experience || prev.experience,
        education: generatedData.education || prev.education,
        certifications:
          generatedData.certifications || prev.certifications,
        projects: generatedData.projects || prev.projects,
        languages: generatedData.languages || prev.languages,
        cv_url: uploadedCvUrl || prev.cv_url,
      }));

      if (uploadedCvUrl) {
        setCvFile(null);
      }

      if (generatedData.description) {
        setDescriptionContent(generatedData.description);
      }
      if (generatedData.about_work) {
        setAboutWorkContent(generatedData.about_work);
      }

      if (generatedData.skills) {
        const skillsArray = generatedData.skills
          .split(",")
          .map((skill: string) => skill.trim());
        setSelectedSkills(skillsArray);
      }

      if (generatedData.country) {
        const countryObj = countries.find((c) =>
          c.value.toLowerCase().includes(generatedData.country.toLowerCase()),
        );
        if (countryObj) {
          setSelectedCountry(countryObj);
        }
      }

      if (uploadedCvUrl) {
        toast.success("Resume uploaded successfully!");
      }
      toast.success("Profile data generated successfully!");
    } catch (error) {
      console.error("Error processing generated data:", error);
      toast.error("Failed to process generated data");
    } finally {
      setIsPDFImporting(false);
    }
  };

  const profileCompletion = useMemo(() => {
    const completedRequired = REQUIRED_COMPLETION_KEYS.filter((key) =>
      Boolean(profileData[key]),
    ).length;
    const extraSignals = [
      stripHtmlLength(descriptionContent) > 0,
      stripHtmlLength(aboutWorkContent) > 0,
      selectedSkills.length > 0,
      Boolean(profileData.cv_url || cvFile),
      Boolean(profileData.talent || profileData.mentor || profileData.recruiter),
    ].filter(Boolean).length;
    const totalChecks = REQUIRED_COMPLETION_KEYS.length + 5;
    return Math.round(((completedRequired + extraSignals) / totalChecks) * 100);
  }, [aboutWorkContent, cvFile, descriptionContent, profileData, selectedSkills]);

  const profileDisplayName = `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim();
  const currentChapterIndex = PROFILE_CHAPTERS.findIndex((chapter) =>
    chapterHasSection(chapter, activeSection),
  );
  const currentChapterMeta =
    PROFILE_CHAPTERS[currentChapterIndex] || PROFILE_CHAPTERS[0];
  const isLastChapter = currentChapterIndex === PROFILE_CHAPTERS.length - 1;
  const canEditApprovedProfile = isApprovedProfile;
  const roleSelectionLocked = isProfileInReview;
  const submitActionLabel = isApprovedProfile
    ? "Submit Role Request for Review"
    : "Submit Profile for Review";
  const isReviewReady = useMemo(() => {
    const requiredFields = [
      profileData.title,
      profileData.description,
      profileData.first_name,
      profileData.last_name,
      selectedCountry?.value || profileData.country,
      profileData.city,
      selectedCountry?.phoneCode || profileData.phone_country_code,
      profileData.phone_number,
      profileData.email,
      profileData.about_work,
      profileData.telegram,
    ];

    const hasRole =
      Boolean(profileData.talent) ||
      Boolean(profileData.mentor) ||
      Boolean(profileData.recruiter);
    const hasCv = Boolean(profileData.cv_url || cvFile);
    const hasSkills = selectedSkills.length > 0;
    const hasRatePair =
      profileData.min_rate !== undefined &&
      profileData.min_rate !== null &&
      profileData.max_rate !== undefined &&
      profileData.max_rate !== null &&
      Number(profileData.min_rate) <= Number(profileData.max_rate);

    return (
      requiredFields.every(Boolean) && hasRole && hasCv && hasSkills && hasRatePair
    );
  }, [cvFile, profileData, selectedCountry, selectedSkills]);
  const availabilityLabel =
    profileData.availability === true || profileData.availability === "Available"
      ? "Available"
      : "Unavailable";
  const statusLabel = isProfileInReview
    ? "Under Review"
    : profileData.approved
      ? "Approved"
      : "Not Submitted";
  const scrollToActiveSectionTop = useCallback(() => {
    requestAnimationFrame(() => {
      const sectionElement = document.querySelector<HTMLElement>(
        '[data-section-active="true"]',
      );

      if (!sectionElement) return;

      const topOffset = 110;
      const absoluteTop =
        sectionElement.getBoundingClientRect().top + window.scrollY - topOffset;

      window.scrollTo({
        top: Math.max(absoluteTop, 0),
        behavior: "smooth",
      });
    });
  }, []);
  const goToSection = useCallback((sectionId: ProfileSectionId) => {
    setActiveSection(sectionId);
    scrollToActiveSectionTop();
  }, [scrollToActiveSectionTop]);
  const handleNextSection = useCallback(() => {
    if (isLastChapter) return;
    const nextChapter = PROFILE_CHAPTERS[currentChapterIndex + 1];
    if (nextChapter) {
      setActiveSection(nextChapter.sections[0]);
      scrollToActiveSectionTop();
    }
  }, [currentChapterIndex, isLastChapter, scrollToActiveSectionTop]);

  if (isTokenVerifying) {
    return <HoneybeeSpinner message={"Verifying authentication..."} />;
  }

  if (isProfileDataFetching) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Loading Your Profile..."} />;
  }

  if (saveProfileLoading) {
    window.scrollTo(0, 0);
    return <HoneybeeSpinner message={"Saving Your Profile..."} />;
  }

  return (
    <div className="gh-profile-shell min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_24%),linear-gradient(180deg,_#fffefb_0%,_#f8fafc_34%,_#f8fafc_100%)]">
      <div className="w-full px-4 pb-14 pt-6 sm:px-6 lg:px-10 xl:px-12 2xl:px-12">
        <div className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,251,235,0.9),_rgba(255,255,255,0.98)_72%)] px-5 py-6 sm:px-7 lg:px-8">
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span className="gh-pill rounded-full px-3 py-1 text-amber-700">
                    Talent profile center
                  </span>
                  <span className="gh-pill rounded-full px-3 py-1">
                    {statusLabel}
                  </span>
                  <span className="gh-pill rounded-full px-3 py-1">
                    {availabilityLabel}
                  </span>
                </div>
                <h1 className="flex max-w-2xl items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(255,244,214,0.98),_rgba(255,255,255,0.9))] shadow-[0_10px_24px_rgba(245,158,11,0.14)] ring-1 ring-amber-100">
                    <span className="relative h-7 w-7">
                      <Image
                        src="/icons/profile-bee.svg"
                        alt=""
                        fill
                        className="object-contain"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                  <span>My Talent Profile</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Shape the version of you clients remember first.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="gh-metric-tile rounded-[22px] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Completion
                    </p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-2xl font-semibold text-slate-950">
                        {profileCompletion}%
                      </span>
                      <span className="pb-1 text-xs font-medium text-slate-500">
                        ready
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,_#f59e0b,_#f97316)] transition-all duration-300"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                  </div>
                  <div className="gh-metric-tile rounded-[22px] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Specializations
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {selectedSkills.length}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Added
                    </p>
                  </div>
                  <div className="gh-metric-tile rounded-[22px] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Resume
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {profileData.cv_url || cvFile ? "Ready" : "Missing"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Review file
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
                <button
                  type="button"
                  onClick={() => router.push(`/talents/${user_id}`)}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                >
                  <Eye className="h-4 w-4" />
                  View Public Profile
                </button>
                <button
                  type="button"
                  onClick={() => setIsPDFModalOpen(true)}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] px-5 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(249,115,22,0.28)]"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Profile with AI
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-7 lg:px-8">
            <StatusBanner profileData={profileData} />

            <div className="mt-6 xl:hidden">
              <div className="gh-soft-panel rounded-[22px] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Current chapter
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-950">
                      {currentChapterMeta.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {currentChapterMeta.description}
                    </p>
                  </div>
                  <div className="gh-pill rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {currentChapterIndex + 1} / {PROFILE_CHAPTERS.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
              <aside className="hidden xl:block">
                <div className="sticky top-24 rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <ProfileImageUpload
                        currentImage={profileData.image_url}
                        displayName={profileDisplayName}
                        onImageUpdate={(imageUrl) => {
                          setProfileData((prev) => ({
                            ...prev,
                            image_url: imageUrl,
                          }));
                          setProfileImage(null);
                        }}
                        size={92}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-slate-950">
                        {profileDisplayName || "Your talent profile"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                        {profileData.title || "Add your headline"}
                      </p>
                    </div>
                  </div>

                  <div className="gh-soft-panel mt-5 grid gap-3 rounded-[22px] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Status</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Availability</span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                        {availabilityLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Skills</span>
                      <span className="font-semibold text-slate-900">
                        {selectedSkills.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Profile chapters
                      </p>
                      <span className="text-xs font-medium text-slate-400">
                        {PROFILE_CHAPTERS.length} total
                      </span>
                    </div>
                    <nav className="space-y-2">
                    {PROFILE_CHAPTERS.map((chapter, index) => {
                      const isActive = chapter.id === currentChapterMeta.id;
                      return (
                        <button
                          key={chapter.id}
                          type="button"
                          onClick={() => goToSection(getChapterStartSection(chapter))}
                          className={`gh-chapter-button group w-full rounded-[22px] px-4 py-4 text-left transition ${
                            isActive
                              ? "is-active text-slate-950"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-semibold ${
                                isActive
                                  ? "bg-white text-amber-700 shadow-sm"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold leading-5">
                                {chapter.label}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-400">
                                {chapter.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    </nav>
                  </div>
                </div>
              </aside>

              <main className="min-w-0">
                <form className="space-y-6">
                  <SectionCard
                    id="overview"
                    isActive={chapterHasSection(currentChapterMeta, "overview")}
                    eyebrow="Profile Overview"
                    title="Identity and profile status"
                    description="Core details clients notice first."
                  >
                    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
                      <div className="gh-soft-panel rounded-[24px] p-5">
                        <div className="flex justify-center">
                          <ProfileImageUpload
                            currentImage={profileData.image_url}
                            displayName={profileDisplayName}
                            onImageUpdate={(imageUrl) => {
                              setProfileData((prev) => ({
                                ...prev,
                                image_url: imageUrl,
                              }));
                              setProfileImage(null);
                            }}
                            size={168}
                          />
                        </div>
                        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                          <div className="gh-overview-badge rounded-full px-3.5 py-2">
                            <CircleCheckBig className="h-4 w-4" />
                            <span>{statusLabel}</span>
                          </div>
                          <div className="gh-overview-badge rounded-full px-3.5 py-2">
                            <Globe className="h-4 w-4" />
                            <span>
                              {profileData.hide_contact_details
                                ? "Private"
                                : "Public"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="gh-tint-panel rounded-[22px] p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Live status
                            </p>
                            <h3 className="mt-2 text-lg font-semibold text-slate-950">
                                Open for the right opportunities
                              </h3>
                            </div>
                            <div className="gh-pill rounded-2xl px-4 py-3">
                              <AvailabilityToggle
                                name="availability"
                                checked={
                                  profileData.availability === true ||
                                  profileData.availability === "Available"
                                }
                                onChange={handleToggleChange}
                                errorMessage={errors.availability}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <FieldLabel htmlFor="title" required>
                            Profile header
                          </FieldLabel>
                          <input
                            id="title"
                            className="form-control block w-full"
                            placeholder="Senior smart contract engineer focused on DeFi and product delivery"
                            type="text"
                            maxLength={100}
                            value={profileData.title || ""}
                            onChange={(e) =>
                              handleInputChange("title", e.target.value)
                            }
                          />
                          <FieldError message={errors.title} />
                          <FieldHint>
                            Keep it short and specific.
                          </FieldHint>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="gh-muted-panel rounded-2xl px-4 py-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                              <Globe className="h-4 w-4" />
                              Visibility
                            </div>
                            <p className="mt-2 text-base font-semibold text-slate-950">
                              {profileData.hide_contact_details
                                ? "Private contact details"
                                : "Public contact details"}
                            </p>
                          </div>
                          <div className="gh-muted-panel rounded-2xl px-4 py-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                              <Layers3 className="h-4 w-4" />
                              Skills
                            </div>
                            <p className="mt-2 text-base font-semibold text-slate-950">
                              {selectedSkills.length} selected
                            </p>
                          </div>
                          <div className="gh-muted-panel rounded-2xl px-4 py-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                              <FileText className="h-4 w-4" />
                              Resume
                            </div>
                            <p className="mt-2 text-base font-semibold text-slate-950">
                              {profileData.cv_url || cvFile
                                ? "Uploaded"
                                : "Still needed"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    id="public-intro"
                    isActive={chapterHasSection(currentChapterMeta, "public-intro")}
                    eyebrow="Public Intro"
                    title="How your profile introduces you"
                    description="A short summary for clients."
                  >
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="gh-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-amber-600">
                            <BadgeCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Make it client-ready
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              Focus on impact, specialty, and fit.
                            </p>
                          </div>
                        </div>
                        <div className="gh-pill rounded-full px-3 py-1.5 text-sm font-medium text-slate-600">
                          {stripHtmlLength(descriptionContent)}/10000 chars
                        </div>
                      </div>

                      <div className="gh-editor-shell overflow-hidden rounded-[22px] bg-white">
                        <ReactQuill
                          theme="snow"
                          modules={quillModules}
                          className="quill-editor"
                          value={descriptionContent}
                          onChange={(content) => {
                            setDescriptionContent(content);
                            handleInputChange("description", content);
                          }}
                          placeholder="Summarize your expertise, standout work, and the value you bring."
                        />
                      </div>
                      <FieldError message={errors.description} />
                    </div>
                  </SectionCard>

                  <SectionCard
                    id="personal-details"
                    isActive={chapterHasSection(currentChapterMeta, "personal-details")}
                    eyebrow="Personal Details"
                    title="Contact and location"
                    description="The essentials teams need."
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="first_name" required>
                          First name
                        </FieldLabel>
                        <input
                          id="first_name"
                          className="form-control block w-full"
                          placeholder="First name"
                          type="text"
                          pattern="[a-zA-Z -]+"
                          maxLength={100}
                          value={profileData.first_name || ""}
                          onChange={(e) =>
                            handleInputChange("first_name", e.target.value)
                          }
                        />
                        <FieldError message={errors.first_name} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="last_name" required>
                          Last name
                        </FieldLabel>
                        <input
                          id="last_name"
                          className="form-control block w-full"
                          placeholder="Last name"
                          type="text"
                          pattern="[a-zA-Z -]+"
                          maxLength={100}
                          value={profileData.last_name || ""}
                          onChange={(e) =>
                            handleInputChange("last_name", e.target.value)
                          }
                        />
                        <FieldError message={errors.last_name} />
                      </div>
                      <div>
                        <SearchableSelectInput
                          required={false}
                          labelText="Country"
                          name="country"
                          inputValue={selectedCountry}
                          setInputValue={handleCountryChange}
                          options={countries}
                          placeholder="Search for a country..."
                          labelClassName="!ml-0 !mb-2 !text-sm !font-semibold !text-slate-800"
                          triggerClassName="!rounded-2xl !border-[rgba(148,163,184,0.26)] !px-4 !py-[13px] !text-slate-900 !shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                          dropdownClassName="!rounded-2xl !border !border-slate-200 !shadow-[0_18px_30px_rgba(15,23,42,0.08)]"
                          defaultValue={
                            countries[
                              countries.findIndex(
                                (country) =>
                                  country.value === profileData.country,
                              )
                            ]
                          }
                        />
                        <FieldError message={errors.country} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="city" required>
                          City
                        </FieldLabel>
                        <input
                          id="city"
                          className="form-control block w-full"
                          placeholder="City"
                          type="text"
                          pattern="[a-zA-Z -]+"
                          maxLength={100}
                          value={profileData.city || ""}
                          onChange={(e) =>
                            handleInputChange("city", e.target.value)
                          }
                        />
                        <FieldError message={errors.city} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="phone_country_code" required>
                          Phone country code
                        </FieldLabel>
                        <input
                          id="phone_country_code"
                          className="form-control block w-full"
                          placeholder="Phone country code"
                          type="text"
                          value={
                            selectedCountry?.phoneCode ||
                            profileData.phone_country_code ||
                            "+1"
                          }
                          readOnly
                        />
                        <FieldError message={errors.phone_country_code} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="phone_number" required>
                          Phone number
                        </FieldLabel>
                        <input
                          id="phone_number"
                          className="form-control block w-full"
                          placeholder="Phone number"
                          type="number"
                          maxLength={20}
                          value={profileData.phone_number || ""}
                          onChange={(e) =>
                            handleInputChange("phone_number", e.target.value)
                          }
                        />
                        <FieldError message={errors.phone_number} />
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel htmlFor="email" required>
                          Email
                        </FieldLabel>
                        <input
                          id="email"
                          className="form-control block w-full"
                          placeholder="Email"
                          type="email"
                          maxLength={255}
                          value={profileData.email || ""}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                        />
                        <FieldError message={errors.email} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    id="work-preferences"
                    isActive={chapterHasSection(currentChapterMeta, "work-preferences")}
                    eyebrow="Work Preferences"
                    title="Rates, roles, and setup"
                    description="How you want to work."
                  >
                    <div className="space-y-6">
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div>
                          <FieldLabel required>
                            Hourly rate range (USD/hour)
                          </FieldLabel>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <input
                                className="form-control block w-full"
                                placeholder="Minimum rate"
                                type="number"
                                maxLength={255}
                                value={profileData.min_rate ?? ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "min_rate",
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value),
                                  )
                                }
                              />
                            </div>
                            <div>
                              <input
                                className="form-control block w-full"
                                placeholder="Maximum rate"
                                type="number"
                                maxLength={255}
                                value={profileData.max_rate ?? ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    "max_rate",
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value),
                                  )
                                }
                              />
                            </div>
                          </div>
                          <FieldError
                            message={errors.min_rate || errors.max_rate}
                          />
                          <FieldHint>
                            Required before profile submission.
                          </FieldHint>
                        </div>

                        <div className="gh-muted-panel rounded-[22px] px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              Contact privacy
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                            Control what stays public.
                            </p>
                          <div className="mt-4">
                            <ToggleButton
                              label="Hide my contact details"
                              name="hide_contact_details"
                              checked={profileData.hide_contact_details ?? false}
                              setValue={handleToggleChange}
                            />
                            <FieldError
                              message={errors.hide_contact_details}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="gh-soft-panel grid gap-4 rounded-[22px] p-5 lg:grid-cols-2">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Work arrangement
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                            Choose your setup.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-5">
                          <ToggleButton
                            label="Freelance Only"
                            name="freelance_only"
                            checked={profileData.freelance_only ?? false}
                            setValue={handleToggleChange}
                          />
                          <ToggleButton
                            label="Remote Only"
                            name="remote_only"
                            checked={profileData.remote_only ?? false}
                            setValue={handleToggleChange}
                          />
                        </div>
                      </div>

                      <div className="gh-muted-panel rounded-[22px] px-5 py-5">
                        <div className="flex items-start gap-3">
                          <div className="gh-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-amber-600">
                            <BriefcaseBusiness className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              I want to be listed as
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              Pick the roles you want shown.
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-5">
                          {createJobServices.map((service) => {
                            const { label, value } = service;
                            const isChecked = profileData[
                              value as keyof ProfileData
                            ] as boolean;
                            return (
                              <ToggleButton
                                key={value}
                                label={label}
                                name={value}
                                checked={isChecked ?? false}
                                setValue={handleToggleChange}
                              />
                            );
                          })}
                        </div>
                        <FieldError message={errors.role} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    id="about-work"
                    isActive={chapterHasSection(currentChapterMeta, "about-work")}
                    eyebrow="About Your Work"
                    title="What you want next"
                    description="Your ideal role and conditions."
                  >
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="gh-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-amber-600">
                            <UserRound className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Add clear direction
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              Share fit, goals, and momentum.
                            </p>
                          </div>
                        </div>
                        <div className="gh-pill rounded-full px-3 py-1.5 text-sm font-medium text-slate-600">
                          {stripHtmlLength(aboutWorkContent)}/10000 chars
                        </div>
                      </div>

                      <div className="gh-editor-shell overflow-hidden rounded-[22px] bg-white">
                        <ReactQuill
                          theme="snow"
                          modules={quillModules}
                          className="quill-editor"
                          value={aboutWorkContent}
                          onChange={(content) => {
                            setAboutWorkContent(content);
                            handleInputChange("about_work", content);
                          }}
                          placeholder="What kind of work are you looking for, and where do you do your best work?"
                        />
                      </div>
                      <FieldError message={errors.about_work} />
                    </div>
                  </SectionCard>

                  <SectionCard
                    id="resume-imports"
                    isActive={chapterHasSection(currentChapterMeta, "resume-imports")}
                    eyebrow="Resume & Imports"
                    title="Resume and AI setup"
                    description="Upload your CV or generate details."
                  >
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="gh-muted-panel rounded-[22px] p-5">
                        <div className="flex items-start gap-3">
                          <div className="gh-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-amber-600">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              CV upload
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              Keep your resume current for faster review.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <FieldLabel htmlFor="cv" required>
                            Resume file
                          </FieldLabel>
                          {isUploadedCvLink || profileData.cv_url ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-emerald-900">
                                    Resume uploaded
                                  </p>
                                  {profileData.cv_url && (
                                    <a
                                      href={profileData.cv_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-1 inline-flex text-sm font-medium text-emerald-700 underline underline-offset-2"
                                    >
                                      Open uploaded CV
                                    </a>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setIsUploadedCvLink(false)}
                                  className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
                                >
                                  Replace file
                                </button>
                              </div>
                            </div>
                          ) : (
                            <input
                              id="cv"
                              className="form-control block w-full"
                              placeholder="CV"
                              type="file"
                              name="cv"
                              accept=".pdf"
                              onChange={onCvInputChange}
                            />
                          )}
                          <FieldError message={errors.cv_url} />
                          <FieldHint>
                            PDF only. Max upload size: {resumeUploadSizeLimit} MB.
                          </FieldHint>
                        </div>
                      </div>

                      <div className="gh-tint-panel rounded-[22px] p-5">
                        <p className="text-sm font-semibold text-slate-900">
                          AI-assisted profile setup
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Import first, refine after.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsPDFModalOpen(true)}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5"
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate Profile with AI
                        </button>
                        <div className="gh-pill mt-5 rounded-2xl p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            What gets filled
                          </p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Headline, bio, and about-work copy</li>
                            <li>Contact and profile fields detected from your CV</li>
                            <li>Skills and profile links detected from your CV</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <ResumeStructuredSections
                        experience={profileData.experience}
                        education={profileData.education}
                        certifications={profileData.certifications}
                        projects={profileData.projects}
                        languages={profileData.languages}
                        emptyMessage="Imported resume details will appear here after AI parsing."
                      />
                    </div>
                  </SectionCard>

                  <SectionCard
                    id="skills"
                    isActive={chapterHasSection(currentChapterMeta, "skills")}
                    eyebrow="Skills"
                    title="Show where your expertise is strongest"
                    description="Add the skills you want known first."
                  >
                    <div className="space-y-4">
                      <div>
                        <FieldLabel htmlFor="skills" required>
                          Core skills
                        </FieldLabel>
                        <div
                          className={`rounded-[22px] border bg-white p-3 shadow-sm ${
                            errors.skills
                              ? "border-red-300"
                              : "border-slate-200"
                          }`}
                        >
                          <AutoSuggestInput
                            inputs={skills}
                            selectedInputs={selectedSkills}
                            setSelectedInputs={handleSkillsChange}
                            classes="gh-skills-input !h-12 !rounded-2xl !border !border-slate-200 !bg-slate-50 !px-4 !py-3 !text-slate-900 placeholder:!text-slate-400"
                          />
                        </div>
                        <FieldError message={errors.skills} />
                        <FieldHint>
                          Lead with your strongest skills.
                        </FieldHint>
                      </div>

                      {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm font-medium text-slate-800"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedSkills = [...selectedSkills];
                                  updatedSkills.splice(index, 1);
                                  handleSkillsChange(updatedSkills);
                                }}
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                aria-label={`Remove ${skill}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard
                    id="social-presence"
                    isActive={chapterHasSection(currentChapterMeta, "social-presence")}
                    eyebrow="Social Presence"
                    title="Add links that reinforce credibility"
                    description="Links clients can verify."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      {socialLinks.map((socialLink) => (
                        <div
                          key={socialLink.name}
                          className="gh-muted-panel rounded-[22px] px-4 py-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="gh-pill mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-500">
                              {socialLink.name === "linkedin" && (
                                <UserRound className="h-4 w-4" />
                              )}
                              {socialLink.name === "github" && (
                                <Layers3 className="h-4 w-4" />
                              )}
                              {socialLink.name === "twitter" && (
                                <Sparkles className="h-4 w-4" />
                              )}
                              {socialLink.name === "stackoverflow" && (
                                <BadgeCheck className="h-4 w-4" />
                              )}
                              {socialLink.name === "telegram" && (
                                <Send className="h-4 w-4" />
                              )}
                              {socialLink.name === "portfolio" && (
                                <Globe className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold capitalize text-slate-900">
                                {socialLink.name === "stackoverflow"
                                  ? "Stack Overflow"
                                  : socialLink.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Add your {socialLink.placeholder.toLowerCase()}.
                              </p>
                              <div className="mt-3">
                                <SocialLink
                                  name={socialLink.name}
                                  icon={socialLink.icon}
                                  placeholder={socialLink.placeholder}
                                  containerClassName="gh-social-link"
                                  iconClassName="gh-social-link-icon"
                                  inputClassName="!ml-0 !rounded-2xl !bg-white"
                                  defaultValue={
                                    profileData[
                                      socialLink.name as keyof typeof profileData
                                    ]?.toString() || ""
                                  }
                                  setValue={(name, value) =>
                                    handleInputChange(name, value)
                                  }
                                  errorMessage={
                                    errors[
                                      socialLink.name as keyof typeof errors
                                    ]
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard
                    id="referral"
                    isActive={chapterHasSection(currentChapterMeta, "referral")}
                    eyebrow="Referral"
                    title="Referral"
                    description="Invite link and stats."
                  >
                    <ReferralSection />
                  </SectionCard>

                  <div className="gh-sticky-actions sticky bottom-3 z-20 rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.1)] backdrop-blur-xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="gh-section-dots flex items-center gap-2 rounded-full p-1.5">
                          {PROFILE_CHAPTERS.map((chapter, index) => (
                            <button
                              key={chapter.id}
                              type="button"
                              onClick={() => goToSection(getChapterStartSection(chapter))}
                              aria-label={`Go to ${chapter.label}`}
                              aria-current={
                                chapterHasSection(chapter, activeSection)
                                  ? "step"
                                  : undefined
                              }
                              className={`gh-section-dot relative flex h-3.5 items-center justify-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                                chapterHasSection(chapter, activeSection)
                                  ? "is-active"
                                  : ""
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-950">
                          {currentChapterMeta.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {canEditApprovedProfile
                            ? "Your profile is approved. You can edit anything and save changes anytime."
                            : isProfileInReview
                              ? "You already submitted your profile. It is currently under review."
                              : isReviewReady
                                ? "All mandatory details are complete. You can now submit your profile."
                                : "Complete required details, including hourly rate, to submit your profile."}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                        {canEditApprovedProfile && (
                          <button
                            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                            type="button"
                            name="save-talent-only"
                            onClick={handleSaveProfile}
                            disabled={saveProfileLoading}
                          >
                            <Save className="h-4 w-4" />
                            {saveProfileLoading ? "Saving Profile..." : "Save Profile"}
                          </button>
                        )}
                        {!isLastChapter && (
                          <button
                            type="button"
                            onClick={handleNextSection}
                            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 text-sm font-semibold text-amber-800 transition hover:-translate-y-0.5 hover:bg-amber-100"
                          >
                            Next Chapter
                            <span aria-hidden="true">→</span>
                          </button>
                        )}
                        {canShowSubmitAction && (
                          <button
                            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(249,115,22,0.34)] disabled:cursor-not-allowed disabled:opacity-70"
                            type="submit"
                            name="send-for-review"
                            onClick={handleSendForReview}
                            disabled={reviewProfileLoading}
                          >
                            <Send className="h-4 w-4" />
                            {reviewProfileLoading
                              ? "Submitting Profile..."
                              : submitActionLabel}
                          </button>
                        )}
                        {isProfileInReview && (
                          <div className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 text-sm font-semibold text-amber-800">
                            <CircleCheckBig className="h-4 w-4" />
                            Profile Submitted - Under Review
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </main>
            </div>
          </div>
        </div>
      </div>

      <PDFImportModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        onImportSuccess={handlePDFImportSuccess}
        isLoading={isPDFImporting}
      />
    </div>
  );
}
