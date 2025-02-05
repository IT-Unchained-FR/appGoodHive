import LabelOption from "@/interfaces/label-option";

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

  let totalFees = 0;
  const budgetNumber = Number(budget);

  // Calculate fees based on selected services
  if (services.talent) {
    totalFees += budgetNumber * 0.1; // 10% for talent
  }

  if (services.recruiter) {
    totalFees += budgetNumber * 0.08; // 8% for recruiter
  }

  if (services.mentor) {
    totalFees += budgetNumber * 0.12; // 12% for mentor
  }

  return totalFees.toFixed(2);
};
