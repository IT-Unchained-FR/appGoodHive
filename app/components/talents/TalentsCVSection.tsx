"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

type TalentsCVSectionTypes = {
  cv_url: string;
  talent_status: string | null;
  approved?: boolean;
};

const TalentsCVSection: React.FC<TalentsCVSectionTypes> = ({
  cv_url,
  talent_status,
  approved,
}) => {
  // Show CV if it exists and talent is approved (either via talent_status or approved field)
  const isApproved = talent_status === "approved" || approved === true;

  if (!cv_url || !isApproved) {
    return null;
  }

  return (
    <div>
      <Link
        href={cv_url as any}
        target="_blank"
        className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg hover:from-amber-100 hover:to-yellow-100 transition-all duration-200 text-amber-900 font-medium"
      >
        <div className="relative w-8 h-8">
          <Image src="/icons/resume.svg" alt="resume-icon" fill />
        </div>
        <span>View Resume/CV</span>
      </Link>
    </div>
  );
};

export default TalentsCVSection;
