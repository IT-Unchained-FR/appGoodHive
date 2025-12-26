"use client";

import React, { useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import Cookies from "js-cookie";

type TalentsCVSectionTypes = { cv_url: string; talent_status: string };

const TalentsCVSection: React.FC<TalentsCVSectionTypes> = ({
  cv_url,
  talent_status,
}) => {
  const [wallet_address, setWalletAddress] = React.useState<string | undefined>(
    undefined
  );

  const [companyData, setCompanyData] = React.useState<any>({});

  useEffect(() => {
    const walletAddress = Cookies.get("wallet_address");
    setWalletAddress(walletAddress);
  }, []);

  useEffect(() => {
    const fetchCompanyData = async () => {
      const response = await fetch(
        `/api/companies/company-profile?wallet_address=${wallet_address}`,
        { method: "GET" }
      );
      setCompanyData(await response.json());
    };

    if (wallet_address) {
      fetchCompanyData();
    }
  }, [wallet_address]);

  console.log(companyData, "companyData..");

  if (companyData.status === "approved")
    return (
      <div>
        {cv_url && talent_status === "approved" && (
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
        )}
      </div>
    );

  return null;
};

export default TalentsCVSection;
