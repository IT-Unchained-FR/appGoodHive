import React, { useEffect } from "react";

import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

const ReferralCodeHandler = () => {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  useEffect(() => {
    if (referralCode) {
      Cookies.set("referralCode", referralCode, { expires: 30 });
    }
  }, [referralCode]);

  return <></>;
};

export default ReferralCodeHandler;
