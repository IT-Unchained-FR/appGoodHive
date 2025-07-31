import { ToggleButton } from "@/app/components/toggle-button";
import { ProfileData } from "../types";

interface ProfileActionsProps {
  profileData: ProfileData;
  user_id: string;
  onViewPublicProfile: () => void;
  // onLinkedInImport: () => void;
  onToggleChange: (name: string, checked: boolean) => void;
}

export const ProfileActions = ({
  profileData,
  user_id,
  onViewPublicProfile,
  // onLinkedInImport,
  onToggleChange,
}: ProfileActionsProps) => {
  return (
    <>
      {/* Public View Button */}
      <div className="w-full flex justify-center mt-7">
        <button
          type="button"
          onClick={onViewPublicProfile}
          className="px-8 py-3 bg-white border-2 border-[#FFC905] text-gray-800 font-medium rounded-full transition-all duration-300 hover:shadow-lg hover:bg-gray-50 hover:border-[#FF8C05] flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-eye"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View Public Profile
        </button>
      </div>

      {/* LinkedIn Import Button */}
      {/* <div className="w-full flex justify-center mt-4">
        <button
          type="button"
          onClick={() => {}}
          className="px-8 py-3 bg-[#0A66C2] text-white font-medium rounded-full transition-all duration-300 hover:bg-[#004182] hover:shadow-lg flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-linkedin"
          >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" height="12" x="2" y="9" />
            <circle cx="4" cy="4" r="2" />
          </svg>
          Import Profile From LinkedIn
        </button>
      </div> */}

      {/* Availability Toggle */}
      <div className="flex w-full justify-center mt-5">
        <label
          htmlFor="availability"
          className="inline-block ml-3 mr-5 text-base text-black form-label"
        >
          Set Availability
        </label>
        <ToggleButton
          label=""
          name="availability"
          tooltip="If Seeking Jobs"
          checked={profileData.availability}
          setValue={onToggleChange}
        />
      </div>
    </>
  );
};
