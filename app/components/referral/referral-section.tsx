import React, { useContext, useEffect, useState } from "react";
import { AddressContext } from "../context";
import { toast } from "react-hot-toast";

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

  const walletAddress = useContext(AddressContext);

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

  const getReferralCode = async () => {
    setIsLoading(true);
    const response = await fetch(
      `/api/referrals/get-referral?walletAddress=${walletAddress}`
    );

    if (!response.ok) {
      setIsLoading(false);
      toast.error("Error geting referral code");
      return;
    }

    const referralUser = await response.json();
    if (referralUser && referralUser?.referral_code) {
      setReferral(referralUser);
    }
    setIsLoading(false);
  };

  const handleClaimReferralCode = async () => {
    try {
      const response = fetch(
        `/api/referrals/create-referral?walletAddress=${walletAddress}`
      );

      toast.promise(response, {
        loading: "Creating referral...",
        success: "Referral code created successfully!",
        error: "Error creating referral code!",
      });
    } catch (error) {
      console.error("Error creating referral code");
    }
  };

  useEffect(() => {
    if (walletAddress) {
      getReferralCode();
    }
  }, [walletAddress]);

  return (
    <div>
      <h1 className="text-xl mb-5">Referral Section:</h1>
      {!referral && !isLoading && (
        <button
          type="button"
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleClaimReferralCode}
        >
          Claim Your Referral Code
        </button>
      )}
      {referral && !!Object.keys(referral).length && (
        <div>
          <p className="text-base mb-2">
            <strong>Your referral link:</strong>{" "}
            {`http://goodhive.io/?ref=${referral?.referral_code}`}
          </p>
          <h3 className="text-base mb-2">
            <strong>Total talents you referred:</strong> {totalTalentsReferred}
          </h3>
          <h3 className="text-base mb-2">
            <strong>Total company you referred:</strong>{" "}
            {totalCompaniesReferred}
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
