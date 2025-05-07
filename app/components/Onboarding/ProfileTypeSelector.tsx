"use client";

import React from "react";
import { Briefcase, User } from "lucide-react";

export type ProfileType = "talent" | "company";

interface ProfileTypeSelectorProps {
  selectedType: ProfileType;
  onSelectType: (type: ProfileType) => void;
  onContinue: () => void;
}

const ProfileTypeSelector: React.FC<ProfileTypeSelectorProps> = ({
  selectedType,
  onSelectType,
  onContinue,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelectType("talent")}
          className={`p-6 rounded-lg border-2 transition-all ${
            selectedType === "talent"
              ? "border-[#FFC905] bg-[#FFC905]/10"
              : "border-gray-200 hover:border-[#FFC905]/50"
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FFC905]/20 flex items-center justify-center">
              <User className="w-6 h-6 text-[#FFC905]" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-800">Talent Profile</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create a profile to showcase your skills and find opportunities
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelectType("company")}
          className={`p-6 rounded-lg border-2 transition-all ${
            selectedType === "company"
              ? "border-[#FFC905] bg-[#FFC905]/10"
              : "border-gray-200 hover:border-[#FFC905]/50"
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FFC905]/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-[#FFC905]" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-800">Company Profile</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create a company profile to post jobs and find talent
              </p>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3 bg-[#FFC905] text-black rounded-lg hover:bg-[#FFD935] transition-colors font-medium"
      >
        Continue
      </button>
    </div>
  );
};

export default ProfileTypeSelector;
