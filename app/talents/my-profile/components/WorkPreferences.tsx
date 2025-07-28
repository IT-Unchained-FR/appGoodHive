import { ToggleButton } from "@/app/components/toggle-button";
import { ProfileData } from "../types";

interface WorkPreferencesProps {
  profileData: ProfileData;
  errors: { [key: string]: string };
  onToggleChange: (name: string, checked: boolean) => void;
}

export const WorkPreferences = ({
  profileData,
  errors,
  onToggleChange,
}: WorkPreferencesProps) => {
  return (
    <>
      {/* Work Preference Toggles */}
      <div className="flex w-full justify-between mt-9 sm:flex-wrap sm:gap-3">
        <ToggleButton
          label="Freelance Only"
          name="freelance_only"
          checked={profileData?.freelance_only ?? false}
          setValue={onToggleChange}
        />
        <ToggleButton
          label="Remote Only"
          name="remote_only"
          checked={profileData?.remote_only ?? false}
          setValue={onToggleChange}
        />
      </div>

      {/* Hide Contact Details Toggle */}
      <div className="w-full mt-5 pl-2">
        <ToggleButton
          label="Hide my contact details"
          name="hide_contact_details"
          checked={profileData?.hide_contact_details ?? false}
          setValue={onToggleChange}
        />
        {errors.hide_contact_details && (
          <p className="text-red-500 text-sm mt-1">
            {errors.hide_contact_details}
          </p>
        )}
      </div>
    </>
  );
};
