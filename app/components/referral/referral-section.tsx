import React, { useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { AddressContext } from "../context";
import { toast } from "react-hot-toast";
import { Tooltip } from "@nextui-org/tooltip";
import Cookies from "js-cookie";

type referralObject = {
  wallet_address: string;
  referral_code: string;
  talents: string[];
  companies: string[];
  approved_talents: string[];
  approved_companies: string[];
};

export const ReferralSection = () => {
  const [referral, setReferral] = useState<null | referralObject>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMyStats, setIsMyStats] = useState(false);

  const user_id = Cookies.get("user_id");

  const totalTalentsReferred = referral?.talents
    ? referral?.talents?.length
    : 0;
  const totalCompaniesReferred = referral?.companies
    ? referral?.companies?.length
    : 0;

  const totalTalentsApproved = referral?.approved_talents
    ? referral?.approved_talents?.length
    : 0;
  const totalCompaniesApproved = referral?.approved_companies
    ? referral?.approved_companies?.length
    : 0;

  const getReferralCode = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(
      `/api/referrals/get-referral?user_id=${user_id}`,
    );

    const referralUser = await response.json();
    if (referralUser && referralUser?.referral_code) {
      setReferral(referralUser);
    }
    setIsLoading(false);
  }, [user_id]);

  const handleClaimReferralCode = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/referrals/create-referral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id,
        }),
      });

      getReferralCode();
    } catch (error) {
      console.error("Error claiming referral code");
      setIsLoading(false);
    }
  };

  const refLinkCopyToClipboard = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/?ref=${referral?.referral_code}`,
    );
    toast.success("Referral link copied to clipboard");
  };

  const onMyStatsClick = () => {
    setIsMyStats(true);
  };

  useEffect(() => {
    if (user_id) {
      getReferralCode();
    }
  }, [user_id, getReferralCode]);

  return (
    <div>
      <h1 className="text-xl mb-5">Referral Section:</h1>
      {!referral ? (
        <button
          type="button"
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleClaimReferralCode}
          disabled={isLoading}
        >
          {isLoading ? "Loading" : "Claim Your Referral Code"}
        </button>
      ) : !isMyStats ? (
        <button
          type="button"
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          onClick={onMyStatsClick}
        >
          My Stats
        </button>
      ) : null}
      {referral && isMyStats && !!Object.keys(referral).length && (
        <div>
          <p className="text-base mb-2 flex gap-2 items-center">
            <strong>Your referral link:</strong>{" "}
            {`${window.location.origin}/?ref=${referral?.referral_code}`}
            <Image
              src="/icons/copy.svg"
              alt="copy-icon"
              width={20}
              height={20}
              className="cursor-pointer"
              onClick={refLinkCopyToClipboard}
            />
          </p>

          <h3 className="flex gap-2 items-center text-base mb-2">
            <strong>Total talents you referred:</strong> {totalTalentsReferred}
            <Tooltip
              style={{ background: "#fff" }}
              content="Earn a 5% bonus on the first year's commission from talents you refer."
            >
              <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full text-center text-base text-white bg-[#FFC905] cursor-pointer">
                ?
              </span>
            </Tooltip>
          </h3>

          <h3 className="flex gap-2 items-center text-base mb-2">
            <strong>Total company you referred:</strong>{" "}
            {totalCompaniesReferred}
            <Tooltip
              style={{ background: "#fff" }}
              content="Earn a 20% bonus on the first year's commission from clients you refer and onboard."
            >
              <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full text-center text-base text-white bg-[#FFC905] cursor-pointer">
                ?
              </span>
            </Tooltip>
          </h3>

          <h3 className="text-base mb-2">
            <strong>Approved Talents:</strong> {totalTalentsApproved}
          </h3>
          <h3 className="text-base mb-2">
            <strong>Approved Companies:</strong> {totalCompaniesApproved}
          </h3>
        </div>
      )}
    </div>
  );
};
