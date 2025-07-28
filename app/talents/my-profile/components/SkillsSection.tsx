import { AutoSuggestInput } from "@/app/components/autosuggest-input";
import { ProfileData } from "../types";

interface SkillsSectionProps {
  profileData: ProfileData;
  errors: { [key: string]: string };
  selectedSkills: string[];
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
}

export const SkillsSection = ({
  profileData,
  errors,
  selectedSkills,
  skills,
  onSkillsChange,
}: SkillsSectionProps) => {
  return (
    <div className="relative flex flex-col gap-4 mt-12 mb-2 z-30 sm:flex-row">
      <div className="flex-1">
        <label
          htmlFor="skills"
          className="inline-block ml-3 text-base font-bold text-black form-label"
        >
          Skills*
        </label>
        <div
          className={`absolute w-full pt-1 pr-10 text-base font-normal text-gray-600 bg-white form-control ${errors.skills ? "border border-red-500 rounded-lg" : ""}`}
        >
          <AutoSuggestInput
            inputs={skills}
            selectedInputs={selectedSkills}
            setSelectedInputs={onSkillsChange}
          />
          {errors.skills && (
            <p className="text-red-500 text-sm mt-1 ml-3">{errors.skills}</p>
          )}
        </div>
        <div className="pt-10">
          {!!selectedSkills && selectedSkills?.length > 0 && (
            <div className="flex flex-wrap mt-4 ">
              {selectedSkills.map((skill, index) => (
                <div
                  key={index}
                  className="border border-[#FFC905] flex items-center bg-gray-200 rounded-full py-1 px-3 m-1"
                >
                  <span className="mr-2">{skill}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedSkills = [...selectedSkills];
                      updatedSkills.splice(index, 1);
                      onSkillsChange(updatedSkills);
                    }}
                    className="w-6 text-black bg-gray-400 rounded-full"
                  >
                    &#10005;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
