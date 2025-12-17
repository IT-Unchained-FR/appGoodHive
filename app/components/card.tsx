"use client";
// opengraph-image
import "@/app/styles/rich-text.css";
import Image from "next/image";
import Link from "next/link";

import { generateCountryFlag } from "@utils/generate-country-flag";
import type { FC, MouseEvent } from "react";
import LastActiveStatus from "./LastActiveStatus";
import { OptimizedJobBalance } from "./OptimizedJobBalance";
import { analytics } from "@/lib/analytics";
import { useAuth } from "@/app/contexts/AuthContext";
import { CompanyInfoGuard } from "./CompanyInfoGuard";

interface Props {
  jobId?: string; // UUID string
  blockId?: number;
  uniqueId: string;
  type: string;
  title: string;
  postedBy: string;
  postedOn: string;
  image: string;
  country: string;
  city: string;
  budget: number;
  projectType: string;
  currency: string;
  description: string;
  skills: string[];
  buttonText: string;
  escrowAmount?: boolean;
  escrowCurrency?: string;
  walletAddress?: string;
  mentor?: boolean;
  recruiter?: boolean;
  talent?: boolean;
  freelancer?: boolean;
  remote?: boolean;
  availability?: boolean;
  last_active?: Date;
}

export const Card: FC<Props> = ({
  jobId,
  blockId,
  uniqueId,
  title,
  postedBy,
  postedOn,
  image,
  country,
  city,
  description,
  skills,
  budget,
  projectType,
  currency = "",
  escrowAmount,
  walletAddress,
  mentor,
  recruiter,
  talent,
  freelancer,
  remote,
  availability,
  type,
}) => {
  // Function to generate dynamic "Open to" text
  const getOpenToText = () => {
    const openToTypes = [];
    if (talent) openToTypes.push("Talents");
    if (mentor) openToTypes.push("Mentors");
    if (recruiter) openToTypes.push("Recruiters");

    if (openToTypes.length === 0) return "Open to All"; // Changed from null to "Open to All"
    if (openToTypes.length === 1) return `Open to ${openToTypes[0]}`;
    if (openToTypes.length === 2) return `Open to ${openToTypes.join(" & ")}`;
    if (openToTypes.length === 3)
      return `Open to ${openToTypes[0]}, ${openToTypes[1]} & ${openToTypes[2]}`;

    return `Open to ${openToTypes.slice(0, -1).join(", ")} & ${openToTypes[openToTypes.length - 1]}`;
  };

  const { isAuthenticated } = useAuth();

  // Function to strip HTML tags (CSS line-clamp handles truncation)
  const stripHtmlAndCrop = (html: string, maxLength: number) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Increase char limit since CSS line-clamp handles visual truncation
  const croppedDescription = stripHtmlAndCrop(description, 200);

  // Profile image
  const profileImage = image ? image : "/img/placeholder-image.png";

  // Know more link
  const knowMoreLink =
    type === "talent" ? `/talents/${uniqueId}` :
    type === "job" && jobId ? `/jobs/${jobId}` :
    type === "job" ? `#` : // Disable link if jobId is missing (shouldn't happen)
    `/companies/${uniqueId}`;

  // Handle click tracking
  const handleCardClick = () => {
    if (type === "job" && jobId) {
      analytics.jobCardClicked(jobId, title, postedBy);
    } else if (type === "talent") {
      analytics.buttonClicked('talent_profile_view', 'talent_card');
    }
  };

  // Flag & Escrow Icon - ensure all cards have flags
  const countryFlag = generateCountryFlag(country);
  const hasEscrow = jobId !== undefined && escrowAmount;

  // Skills - show max 3 skills for consistent sizing
  const displaySkills = skills.slice(0, 3);
  const hasMoreSkills = skills.length > 3;

  // Generate consistent badge for all job cards
  const shouldShowBadge = type === "company" || type === "job"; // Only show badges for job cards

  const hideCompanyDetails = type === "job" && !isAuthenticated;

  const handleCompanyClick = (event: MouseEvent) => {
    if (hideCompanyDetails) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div className="group relative bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/40 rounded-2xl border border-amber-100/60 shadow-sm hover:shadow-2xl hover:border-[#FFC905]/30 transition-all duration-300 ease-in-out cursor-pointer flex flex-col backdrop-blur-sm">
      {/* Honey comb pattern background accent */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-20 pointer-events-none overflow-hidden rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-full h-full text-yellow-400 transform rotate-12"
        >
          <path d="M17.5 3.5L22 6.5v6l-4.5 3L13 12.5v-6l4.5-3z M6.5 8.5L11 11.5v6l-4.5 3L2 17.5v-6l4.5-3z" />
        </svg>
      </div>

      {/* Top Banner - Status Badge & Balance (both on left) */}
      {shouldShowBadge && (
        <div className="bg-gradient-to-r from-amber-50/50 to-yellow-50/30 border-b border-amber-100/40 px-3 py-2 flex items-center gap-2">
          {/* Status badge */}
          {hasEscrow ? (
            <div className="flex items-center gap-1.5 bg-green-50/90 border border-green-200/60 rounded-lg px-2 py-0.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-700">
                Secured
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-200/60 rounded-lg px-2 py-0.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              <span className="text-xs font-medium text-amber-700">Open</span>
            </div>
          )}

          {/* USDC balance */}
          <OptimizedJobBalance
            jobId={jobId}
            blockId={blockId}
            currency={currency}
            amount={budget}
          />
        </div>
      )}

      <div className="p-4 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-start gap-2 sm:gap-3 mb-3">
          {hideCompanyDetails ? (
            <CompanyInfoGuard
              isVisible={false}
              seed={jobId || uniqueId || title}
              compact
              placement="top"
              className="relative flex-shrink-0"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-200 overflow-hidden ring-2 ring-amber-200 shadow-sm border border-amber-200">
                  <Image
                    className="object-cover w-full h-full"
                    src={profileImage}
                    alt="Company logo hidden"
                    width={48}
                    height={48}
                    sizes="(max-width: 640px) 40px, 48px"
                    style={{
                      filter: "blur(10px) brightness(1.05)",
                      opacity: 0.65,
                      WebkitMaskImage:
                        "radial-gradient(circle at center, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.5) 70%, transparent 90%)",
                      maskImage:
                        "radial-gradient(circle at center, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.5) 70%, transparent 90%)",
                      transform: "scale(1.05)",
                      transition: "all 0.3s ease",
                    }}
                  />
                </div>
                {/* Bee accent on company logo */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#FFC905] rounded-full flex items-center justify-center text-[10px] sm:text-xs shadow-sm">
                  🐝
                </div>
              </div>
            </CompanyInfoGuard>
          ) : (
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-200 overflow-hidden ring-2 ring-amber-200 shadow-sm border border-amber-200">
                <Image
                  className="object-cover w-full h-full"
                  src={profileImage}
                  alt="Company logo"
                  width={48}
                  height={48}
                  sizes="(max-width: 640px) 40px, 48px"
                />
              </div>
              {/* Bee accent on company logo */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#FFC905] rounded-full flex items-center justify-center text-[10px] sm:text-xs shadow-sm">
                🐝
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Single line title with native tooltip */}
            <h3
              className="text-sm sm:text-base font-semibold text-gray-900 mb-1 leading-tight truncate"
              title={title}
            >
              {title}
            </h3>

            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
              <Link
                href={
                  jobId ? `/companies/${uniqueId}` : `/talents/${uniqueId}`
                }
                className="relative inline-flex max-w-[150px] min-w-0 items-center text-xs sm:text-sm font-medium text-gray-600 hover:text-[#FFC905] transition-colors"
                title={!hideCompanyDetails ? postedBy : "Sign in to reveal"}
                onClick={handleCompanyClick}
              >
                {hideCompanyDetails ? (
                  <span className="overflow-visible">
                    <CompanyInfoGuard
                      value={undefined}
                      seed={jobId || uniqueId || title}
                      isVisible={false}
                      compact
                      textClassName="!text-xs sm:!text-sm !font-medium tracking-wide text-gray-500"
                      blurAmount="blur-[3px]"
                      placement="top"
                    />
                  </span>
                ) : (
                  <span className="truncate">{postedBy}</span>
                )}
              </Link>

              {/* Modern Country Flag Display */}
              {countryFlag && (
                <div className="flex items-center gap-1 sm:gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 border border-gray-200/60 shadow-sm">
                  <div className="relative w-3 h-2 sm:w-4 sm:h-3 rounded-sm overflow-hidden shadow-sm border border-gray-200">
                    <Image
                      src={countryFlag}
                      alt={`${country} flag`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-700 capitalize">
                    {country}
                  </span>
                </div>
              )}
            </div>

            {/* Location info */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                {city || "Remote"}
              </span>
            </div>
          </div>
        </div>

        {/* Description - 2 lines max */}
        <div className="mb-3">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
            {croppedDescription ||
              "Exciting opportunity to join our team and make an impact."}
          </p>
        </div>

        {/* Skills - Show max 3 */}
        <div className="mb-3">
          {displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displaySkills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md border border-gray-200"
                >
                  {skill}
                </span>
              ))}
              {hasMoreSkills && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                  +{skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-grow"></div>

        {/* Footer */}
        <div className="pt-3 border-t border-amber-200/50 mt-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="truncate">{postedOn}</span>
            </div>

            {/* Open to badges */}
            {(type === "company" || type === "job") && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-blue-600 flex items-center gap-1 truncate bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                  <svg
                    className="w-3 h-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  <span className="truncate font-medium">
                    {getOpenToText()}
                  </span>
                </span>
              </div>
            )}

            {type === "talent" && (
              <>
                <LastActiveStatus lastActiveTime={postedOn} />
                {(freelancer || remote) && (
                  <div className="flex items-center gap-1 text-xs">
                    {freelancer && remote ? (
                      <span className="text-green-600">💼 Freelancing & Remote</span>
                    ) : freelancer ? (
                      <span className="text-green-600">💼 Freelancing Only</span>
                    ) : (
                      <span className="text-blue-600">🌐 Remote Only</span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* View Details Button */}
            <Link href={knowMoreLink} onClick={handleCardClick}>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#FFC905] to-[#FFD93D] hover:from-[#FF8C05] hover:to-[#FFC905] rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FFC905]/50 w-full">
                <span>View Details</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </Link>
          </div>
        </div>

        {/* Availability indicator for talents */}
        {type === "talent" && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-200/50">
            <div
              className={`w-2 h-2 rounded-full ${availability ? "bg-green-400" : "bg-red-400"} shadow-sm`}
            ></div>
            <span
              className={`text-[10px] sm:text-xs font-medium ${availability ? "text-green-600" : "text-red-600"}`}
            >
              {availability ? "Available for work" : "Not available"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
