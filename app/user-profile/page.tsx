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

  // Add custom animations
  const animationStyles = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(5deg); }
    }
    @keyframes floatReverse {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(10px) rotate(-5deg); }
    }
    @keyframes honeycombShift {
      0% { background-position: 0 0; }
      100% { background-position: 60px 60px; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-float-reverse { animation: floatReverse 8s ease-in-out infinite; }
    .animate-honeycomb { animation: honeycombShift 20s linear infinite; }
    .animate-pulse-custom { animation: pulse 4s ease-in-out infinite; }
    .animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
    .animate-shimmer {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      background-size: 200% 100%;
      animation: shimmer 2s ease-in-out infinite;
    }
  `;

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


  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex flex-col items-center justify-center">
        <BeeHiveSpinner size="large" />
        <p className="mt-6 text-xl font-semibold text-amber-700">Loading User Profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: animationStyles}} />
      
      {/* Animated Honeycomb Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 animate-honeycomb" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F59E0B' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Floating Hexagon Decorations with Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-8 h-8 rotate-12 opacity-20 animate-float">
          <div className="w-full h-full bg-amber-400 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        <div className="absolute top-40 right-20 w-6 h-6 rotate-45 opacity-15 animate-float-reverse" style={{animationDelay: '1s'}}>
          <div className="w-full h-full bg-yellow-500 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        <div className="absolute bottom-32 left-1/4 w-10 h-10 rotate-12 opacity-10 animate-float" style={{animationDelay: '2s'}}>
          <div className="w-full h-full bg-orange-400 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        <div className="absolute top-1/3 right-10 w-4 h-4 rotate-90 opacity-25 animate-float-reverse" style={{animationDelay: '3s'}}>
          <div className="w-full h-full bg-amber-300 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        {/* Additional floating elements */}
        <div className="absolute top-60 left-20 w-5 h-5 rotate-30 opacity-15 animate-float" style={{animationDelay: '4s'}}>
          <div className="w-full h-full bg-yellow-400 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
        <div className="absolute bottom-20 right-1/3 w-7 h-7 rotate-60 opacity-20 animate-float-reverse" style={{animationDelay: '5s'}}>
          <div className="w-full h-full bg-amber-500 transform rotate-45" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'}}></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 relative">
          {/* Decorative honeycomb elements around header with pulsing animation */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 -translate-y-8 opacity-10">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-amber-400 transform rotate-45 animate-pulse-custom" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)', animationDelay: '0s'}}></div>
              <div className="w-3 h-3 bg-yellow-400 transform rotate-45 animate-pulse-custom" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)', animationDelay: '1s'}}></div>
              <div className="w-3 h-3 bg-amber-400 transform rotate-45 animate-pulse-custom" style={{clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)', animationDelay: '2s'}}></div>
            </div>
          </div>
          
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-400 rounded-3xl mb-6 shadow-lg relative hover:scale-105 transition-transform duration-300 group">
            <CircleUserRound className="w-10 h-10 text-white group-hover:scale-105 transition-transform duration-300" />
            {/* Subtle hexagon pattern on avatar with shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-3xl group-hover:animate-shimmer" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.1'%3E%3Cpolygon points='10,1 4,5 4,15 10,19 16,15 16,5'/%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-700 via-yellow-700 to-orange-700 bg-clip-text text-transparent mb-4 leading-tight">
            User Profile
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Manage your 🐝 <span className="font-semibold text-amber-700">GoodHive</span> account and track your status across all roles
          </p>
          
          {/* Subtle decorative elements with staggered pulse */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-10">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse-custom" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse-custom" style={{animationDelay: '1s'}}></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse-custom" style={{animationDelay: '2s'}}></div>
            </div>
          </div>
        </div>

        {/* Profile Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {/* Account Information */}
          <div className="lg:col-span-2 xl:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-amber-200/60 h-full hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 hover:border-amber-300/70 hover:scale-102 hover:bg-white group animate-fade-in-up" style={{animationDelay: '0.1s'}}>
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
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-amber-200/60 h-full hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 hover:border-amber-300/70 hover:scale-102 hover:bg-white group animate-fade-in-up" style={{animationDelay: '0.3s'}}>
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
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-amber-200/60 h-full hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 hover:border-amber-300/70 hover:scale-102 hover:bg-white group animate-fade-in-up" style={{animationDelay: '0.5s'}}>
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
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-amber-200/60 hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 hover:border-amber-300/70 hover:scale-105 hover:bg-white animate-fade-in-up" style={{animationDelay: '0.6s'}}>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Account Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
    <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300 hover:scale-102 hover:bg-white/80 group animate-fade-in-up">
      <div className={`w-16 h-16 bg-gradient-to-r ${getColorClasses()} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{label}</p>
    </div>
  );
}
