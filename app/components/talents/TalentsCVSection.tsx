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
          <>
            <h3 className="text-[#4E4E4E] text-lg font-bold mb-3">
              Resume/CV:
            </h3>

            <div className="relative w-12 h-10 mb-7">
              <Link href={cv_url as any} target="_blank">
                <Image src="/icons/resume.svg" alt="resume-icon" fill />
              </Link>
            </div>
          </>
        )}
      </div>
    );

  return null;
};

export default TalentsCVSection;
