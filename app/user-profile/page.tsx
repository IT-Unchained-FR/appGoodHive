"use client";

import Cookies from "js-cookie";
import {
  Briefcase,
  CircleUserRound,
  Copy,
  GraduationCap,
  Mail,
  Shield,
  User,
  Users,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import BeeHiveSpinner from "../components/spinners/bee-hive-spinner";

export interface UserProfile {
  id: number;
  userid: string;
  email: string | null;
  talent_status: "pending" | "approved";
  mentor_status: "pending" | "approved";
  recruiter_status: "pending" | "approved";
  wallet_address?: string;
  okto_wallet_address?: string;
}

export default function UserProfilePage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showConnectEmailPopup, setShowConnectEmailPopup] = useState(false);

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
      console.log(data, "User Data...");
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
    setShowConnectEmailPopup(true);
  };

  if (!userProfile) {
    return <BeeHiveSpinner size="large" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-yellow-50/20 to-orange-50/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-3xl mb-6 shadow-lg">
            <CircleUserRound className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            User Profile
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your GoodHive account and track your status across all roles
          </p>
        </div>

        {/* Profile Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {/* Account Information */}
          <div className="lg:col-span-2 xl:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-amber-100/50 h-full">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Account Info</h2>
              </div>
              
              <div className="space-y-6">
                <InfoItem
                  icon={Mail}
                  label="Email Address"
                  value={userProfile.email || "No Email Connected"}
                  status={userProfile.email ? "connected" : "disconnected"}
                />
                <InfoItem
                  icon={User}
                  label="User ID"
                  value={userProfile.userid}
                  copyable
                />
              </div>
            </div>
          </div>

          {/* Role Status */}
          <div className="lg:col-span-2 xl:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-amber-100/50 h-full">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Role Status</h2>
              </div>
              
              <div className="space-y-4">
                <RoleStatusCard
                  icon={Briefcase}
                  title="Talent"
                  status={userProfile.talent_status}
                  description="Access to job opportunities"
                />
                <RoleStatusCard
                  icon={GraduationCap}
                  title="Mentor"
                  status={userProfile.mentor_status}
                  description="Guide and support others"
                />
                <RoleStatusCard
                  icon={Users}
                  title="Recruiter"
                  status={userProfile.recruiter_status}
                  description="Post jobs and find talent"
                />
              </div>
            </div>
          </div>

          {/* Wallet Connections */}
          <div className="lg:col-span-2 xl:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-amber-100/50 h-full">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-2xl flex items-center justify-center mr-4">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Wallets</h2>
              </div>
              
              <div className="space-y-6">
                <WalletItem
                  icon={Wallet}
                  label="External Wallet"
                  address={userProfile.wallet_address}
                  description="Your connected external wallet"
                />
                <WalletItem
                  icon={Shield}
                  label="GoodHive Wallet"
                  address={userProfile.okto_wallet_address}
                  description="Your secure GoodHive wallet"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-amber-100/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Account Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              value={userProfile.email ? "1" : "0"}
              label="Connected Accounts"
              color="blue"
            />
            <StatCard
              value={[userProfile.talent_status, userProfile.mentor_status, userProfile.recruiter_status].filter(s => s === "approved").length.toString()}
              label="Approved Roles"
              color="green"
            />
            <StatCard
              value={[userProfile.talent_status, userProfile.mentor_status, userProfile.recruiter_status].filter(s => s === "pending").length.toString()}
              label="Pending Approvals"
              color="yellow"
            />
            <StatCard
              value={[userProfile.wallet_address, userProfile.okto_wallet_address].filter(Boolean).length.toString()}
              label="Connected Wallets"
              color="purple"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component Interfaces
interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  status?: "connected" | "disconnected";
  copyable?: boolean;
}

interface RoleStatusCardProps {
  icon: React.ElementType;
  title: string;
  status: "pending" | "approved";
  description: string;
}

interface WalletItemProps {
  icon: React.ElementType;
  label: string;
  address?: string;
  description: string;
}

interface StatCardProps {
  value: string;
  label: string;
  color: "blue" | "green" | "yellow" | "purple";
}

// InfoItem Component
function InfoItem({ icon: Icon, label, value, status, copyable }: InfoItemProps) {
  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() =>
        toast.success("Copied to clipboard!", {
          icon: "📋",
        }),
      )
      .catch((err) => console.error("Failed to copy:", err));
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {status && (
          <div className="flex items-center">
            {status === "connected" ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}

// RoleStatusCard Component
function RoleStatusCard({ icon: Icon, title, status, description }: RoleStatusCardProps) {
  const getStatusColor = () => {
    return status === "approved" 
      ? "from-green-400 to-green-500" 
      : "from-yellow-400 to-yellow-500";
  };

  const getStatusIcon = () => {
    return status === "approved" ? CheckCircle : Clock;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className={`w-12 h-12 bg-gradient-to-r ${getStatusColor()} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-4 h-4 ${status === "approved" ? "text-green-500" : "text-yellow-500"}`} />
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === "approved" 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

// WalletItem Component
function WalletItem({ icon: Icon, label, address, description }: WalletItemProps) {
  const handleCopy = () => {
    if (address) {
      navigator.clipboard
        .writeText(address)
        .then(() =>
          toast.success("Address copied to clipboard!", {
            icon: "🔗",
          }),
        )
        .catch((err) => console.error("Failed to copy:", err));
    }
  };

  const formatAddress = (addr: string) => {
    // Don't truncate if there's space - let CSS handle overflow if needed
    return addr;
  };

  return (
    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </div>
        {address && (
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Copy address"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>
      <div className="text-sm font-mono bg-white/50 p-3 rounded-xl border border-gray-200 break-all">
        {address ? (
          <span className="block w-full">{formatAddress(address)}</span>
        ) : (
          <span className="text-gray-500 flex items-center">
            <XCircle className="w-4 h-4 mr-2" />
            Not Connected
          </span>
        )}
      </div>
    </div>
  );
}

// StatCard Component
function StatCard({ value, label, color }: StatCardProps) {
  const getColorClasses = () => {
    const colors = {
      blue: "from-blue-400 to-blue-500",
      green: "from-green-400 to-green-500", 
      yellow: "from-yellow-400 to-yellow-500",
      purple: "from-purple-400 to-purple-500",
    };
    return colors[color];
  };

  return (
    <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-200">
      <div className={`w-16 h-16 bg-gradient-to-r ${getColorClasses()} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </div>
  );
}
