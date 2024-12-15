"use client";

import { useState } from "react";
import {
  Mail,
  User,
  Briefcase,
  GraduationCap,
  Users,
  Wallet,
  Link,
  ArrowRight,
  CircleUserRound,
} from "lucide-react";

interface UserProfileProps {
  email: string;
  userId: string;
  talentStatus: "Active" | "Inactive";
  mentorStatus: "Available" | "Unavailable";
  recruiterStatus: "Active" | "Inactive";
  walletAddress: string;
}

export default function UserProfilePage() {
  const email = "example@goodhive.com";
  const userId = "USR12345678";
  const talentStatus = "Active" as const;
  const mentorStatus = "Available" as const;
  const recruiterStatus = "Inactive" as const;
  const walletAddress = "0x1234...5678";

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulating an API call
    setTimeout(() => {
      setIsConnecting(false);
      alert("Connected successfully!");
    }, 2000);
  };

  return (
    <div className="bg-white flex items-center justify-center p-4 py-14">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200 animate-fade-in-up">
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
            <ProfileItem icon={Mail} label="Email" value={email} />
            <ProfileItem icon={User} label="User ID" value={userId} />
            <ProfileItem
              icon={Briefcase}
              label="Talent Status"
              value={<StatusBadge status={talentStatus} />}
            />
            <ProfileItem
              icon={GraduationCap}
              label="Mentor Status"
              value={<StatusBadge status={mentorStatus} />}
            />
            <ProfileItem
              icon={Users}
              label="Recruiter Status"
              value={<StatusBadge status={recruiterStatus} />}
            />
            <ProfileItem
              icon={Wallet}
              label="Wallet Address"
              value={walletAddress}
            />
          </div>
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
        </div>
      </div>
    </div>
  );
}

interface ProfileItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function ProfileItem({ icon: Icon, label, value }: ProfileItemProps) {
  return (
    <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg shadow-sm transition-all duration-200 hover:scale-105">
      <Icon className="w-6 h-6 text-yellow-500" />
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="text-lg font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "Active" | "Inactive" | "Available" | "Unavailable";
}) {
  const color =
    status === "Active" || status === "Available"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  return (
    <span className={`${color} text-sm font-medium px-2 py-1 rounded-full`}>
      {status}
    </span>
  );
}
