"use client";

import Image from "next/image";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

import Cookies from "js-cookie";

type Props = {
  linkedin?: string;
  telegram?: string;
  github?: string;
  stackoverflow?: string;
  portfolio?: string;
  twitter: string;
};

export const TalentSocialMedia: FC<Props> = (props) => {
  const { linkedin, telegram, github, stackoverflow, portfolio, twitter } =
    props;
  const [isShowDetails, setIsShowDetails] = useState(false);

  const user_id = Cookies.get("user_id");

  const fetchCompanyData = async () => {
    const userDataResponse = await fetch(
      `/api/companies/my-profile?userId=${user_id}`,
    );

    if (!userDataResponse.ok) {
      setIsShowDetails(false);
      return;
    }

    const userProfile = await userDataResponse.json();
    if (userProfile.approved) {
      setIsShowDetails(true);
      return;
    } else {
      setIsShowDetails(false);
    }
  };
  useEffect(() => {
    if (user_id) {
      fetchCompanyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id]);

  return (
    <div className="flex flex-col mb-10">
      <h4 className="text-[#3E3E3E] font-bold text-lg mb-5">Social Media:</h4>
      {!isShowDetails && (
        <p className="w-full max-h-52 mb-10 text-ellipsis overflow-hidden">
          Only verified company can see talent social media!
        </p>
      )}
      {isShowDetails && (
        <div className="flex gap-2">
          {linkedin && (
            <Link
              href={{ pathname: linkedin }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/linkedin.svg" alt="social-icon" fill />
            </Link>
          )}

          {telegram && (
            <Link
              href={`https://t.me/${telegram}`}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/telegram.svg" alt="social-icon" fill />
            </Link>
          )}

          {github && (
            <Link
              href={{ pathname: github }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/github.svg" alt="social-icon" fill />
            </Link>
          )}
          {stackoverflow && (
            <Link
              href={{ pathname: stackoverflow }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/stackoverflow.svg" alt="social-icon" fill />
            </Link>
          )}
          {twitter && (
            <Link
              href={{ pathname: twitter }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image
                src="/icons/twitter.jpg"
                alt="social-icon"
                fill
                className="rounded-full"
              />
            </Link>
          )}
          {portfolio && (
            <Link
              href={{ pathname: portfolio }}
              target="_blank"
              className="relative w-7 h-7 rounded-full"
            >
              <Image src="/icons/portfolio.svg" alt="social-icon" fill />
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
