import { ToggleButton } from "@/app/components/toggle-button";
import { createJobServices } from "@/app/constants/common";
import { ProfileData } from "../types";

interface RoleSelectionProps {
  profileData: ProfileData;
  errors: { [key: string]: string };
  onToggleChange: (name: string, checked: boolean) => void;
}

export const RoleSelection = ({
  profileData,
  errors,
  onToggleChange,
}: RoleSelectionProps) => {
  return (
    <div className="flex flex-col mt-3">
      <p className="my-4">I want to be:</p>
      <div className="w-1/2 sm:w-full mb-5 px-3 flex justify-between sm:px-1 sm:flex-wrap sm:gap-3">
        {createJobServices.map((service) => {
          const { label, value } = service;
          const isChecked = profileData[value as keyof ProfileData] as boolean;
          return (
            <ToggleButton
              key={value}
              label={label}
              name={value}
              checked={isChecked ?? false}
              setValue={onToggleChange}
            />
          );
        })}
      </div>
      {errors.role && (
        <p className="text-red-500 text-sm mt-1">{errors.role}</p>
      )}
    </div>
  );
};
