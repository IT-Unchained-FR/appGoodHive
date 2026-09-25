import LabelOption from "@/interfaces/label-option";
import { getTotalServiceFeePercent } from "@/app/constants/common";

export const calculateJobCreateFees = (
  projectType: LabelOption | null,
  budget: string,
  services: {
    talent: boolean;
    recruiter: boolean;
    mentor: boolean;
  },
) => {
  // If no project type or budget is selected, return empty string
  if (!projectType || !budget || Number(budget) <= 0) {
    return "";
  }

  const totalFees = (Number(budget) * getTotalServiceFeePercent(services)) / 100;
  return totalFees.toFixed(2);
};

// New function to get the appropriate fee display text based on project type
export const getFeeDisplaySuffix = (projectType: LabelOption | null) => {
  if (!projectType) return "";

  return projectType.value === "fixed" ? "" : "/hr";
};

// New function to get the appropriate budget label for commission display
export const getBudgetLabel = (projectType: LabelOption | null) => {
  if (!projectType) return "Budget";

  return projectType.value === "fixed" ? "Total Budget" : "Hourly Rate";
};
