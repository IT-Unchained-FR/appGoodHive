"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mail,
  User,
  Briefcase,
  GraduationCap,
  Users,
  Wallet,
  Link,
  CircleUserRound,
} from "lucide-react";
import Cookies from "js-cookie";
import { HoneybeeSpinner } from "../components/spinners/honey-bee-spinner/honey-bee-spinner";

export default function UserProfilePage() {
  const [isConnecting, setIsConnecting] = useState(false);
  interface UserProfile {
    id: number;
    userid: string;
    email: string | null;
    talent_status: "pending" | "approved";
    mentor_status: "pending" | "approved";
    recruiter_status: "pending" | "approved";
    wallet_address?: string;
  }

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const user_id = Cookies.get("user_id");

  const fetchUserProfile = useCallback(async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/profile?user_id=${user_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to connect");
      }

      const data = await response.json();
      setUserProfile(data.user);
      setIsConnecting(false);
    } catch (error) {
      setIsConnecting(false);
      alert("Connection failed. Please try again.");
      console.error("Error:", error);
    }
  }, [user_id]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleConnect = () => {
    console.log("Connecting...");
  };

  if (!userProfile) {
    return <HoneybeeSpinner message={"Loading Your User Profile..."} />;
  }

  return (
    <div className="bg-white flex items-center justify-center p-4 py-14">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200 animate-fade-in-up">
        <div className="bg-[#FFC905] p-6 flex gap-4 items-center justify-center">
          <CircleUserRound
            className="
            w-10 h-10 text-white
            animate-bounce-in-down animate-bounce-in-down-1s
          "
          />
          <h1 className="text-3xl font-bold text-center text-white">
            User Profile
          </h1>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <ProfileItem
              icon={Mail}
              label="Email"
              value={
                <StatusBadge
                  color="green"
                  status={userProfile.email || "No Email Connected"}
                />
              }
            />
            <ProfileItem
              icon={User}
              label="User ID"
              value={userProfile?.userid}
            />
            <ProfileItem
              icon={Briefcase}
              label="Talent Status"
              value={
                <StatusBadge status={userProfile?.talent_status as string} />
              }
            />
            <ProfileItem
              icon={GraduationCap}
              label="Mentor Status"
              value={
                <StatusBadge status={userProfile?.mentor_status as string} />
              }
            />
            <ProfileItem
              icon={Users}
              label="Recruiter Status"
              value={
                <StatusBadge status={userProfile?.recruiter_status as string} />
              }
            />
            <ProfileItem
              icon={Wallet}
              label="Wallet Address"
              value={userProfile?.wallet_address || "Not Connected"}
              cropped
            />
          </div>
          {!userProfile.email && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex bg-[#FFC905] text-[#ffffff] font-bold py-3 px-6 rounded-full transition-all duration-200 shadow-lg shadow-yellow-300/50 hover:shadow-yellow-400/70"
              >
                {isConnecting ? (
                  <div className="flex items-center ">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                      Connecting...
                    </span>
                  </div>
                ) : (
                  <span className="flex items-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                    <Link className="mr-2 h-5 w-5" />
                    Connect Email and Password Login
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProfileItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  cropped?: boolean;
}

function ProfileItem({ icon: Icon, label, value, cropped }: ProfileItemProps) {
  const handleCopy = () => {
    if (typeof value === "string") {
      navigator.clipboard
        .writeText(value)
        .then(() => alert("Copied to clipboard!"))
        .catch((err) => console.error("Failed to copy:", err));
    }
  };

  return (
    <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg shadow-sm transition-all duration-200 hover:scale-105">
      <Icon className="w-6 h-6 text-yellow-500" />
      <div className="flex-grow">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="text-sm mt-2 font-semibold text-gray-800">
          {cropped && typeof value === "string" && value.length > 20
            ? `${value.slice(0, 10)}...${value.slice(-20)}`
            : value}
        </div>
      </div>
      {typeof value === "string" && (
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-gray-200 rounded-full"
          title="Copy to clipboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  color,
}: {
  status: "pending" | "approved" | string;
  color?: "green" | "yellow" | "none";
}) {
  let badgeThemeColor;
  if (status === "approved" || color === "green") {
    badgeThemeColor = "bg-green-100 text-green-800";
  } else if (status === "pending" || color === "yellow") {
    badgeThemeColor = "bg-yellow-100 text-yellow-600";
  } else {
    badgeThemeColor = "";
  }
  return (
    <span
      className={`${badgeThemeColor} text-sm font-medium px-2 py-1 rounded-full`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}
