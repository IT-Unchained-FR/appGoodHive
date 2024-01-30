import React, { useContext, useEffect, useState } from "react";
import { Button } from "../button";
import { AddressContext } from "../context";
import { toast } from "react-hot-toast";

export const ReferralSection = () => {
  const [referral, setReferral] = useState(null);

  const walletAddress = useContext(AddressContext);

  const getReferralCode = async () => {
    const response = await fetch(
      `/api/referrals/get-referral?walletAddress=${walletAddress}`
    );

    if (!response.ok) {
      toast.error("Error ban referral code");
      return;
    }

    const referral = await response.json();
    console.log("referral user>> ", referral);
  };

  const handleClaimReferralCode = async () => {
    try {
      const response = await fetch(
        `/api/referrals/create-referral?walletAddress=${walletAddress}`
      );

      if (!response.ok) {
        toast.error("Error creating referral code");
        return;
      }
      toast.success("Referral code created successfully");
    } catch (error) {
      toast.error("Error creating referral code");
    }
  };

  useEffect(() => {
    if (walletAddress) {
      getReferralCode();
    }
  }, [walletAddress]);
  return (
    <div>
      <h1>Referral Section:</h1>
      {!referral && (
        <Button
          text="Claim Your Referral Code"
          type="primary"
          size="medium"
          onClickHandler={handleClaimReferralCode}
        />
      )}
      <div>
        {/* <h3>
          Your referral link: {`http://goodhive.io/?ref=${referral?.code}`}
        </h3> */}
        {/* <h3>Total talents you referred: {referral?.talents}</h3>
        <h3>Total company you referred: {referral?.companies}</h3>
        <h3>Approved Talents: {referral.approvedTalents}</h3>
        <h3>Approved Companies: {referral.approvedCompanies}</h3> */}
      </div>
    </div>
  );
};
