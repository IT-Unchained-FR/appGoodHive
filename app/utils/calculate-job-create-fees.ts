import LabelOption from "@/interfaces/label-option";

export const calculateJobCreateFees = (
  projectType: LabelOption | null,
  budget: string,
  services: {
    talent: boolean;
    recruiter: boolean;
    mentor: boolean;
  }
) => {
  let totalFees = 0;
  if (!projectType) {
    return "";
  }

  if (services.talent) {
    totalFees += Number(budget) * 0.1;
  }

  if (services.recruiter) {
    totalFees += Number(budget) * 0.08;
  }

  if (services.mentor) {
    totalFees += Number(budget) * 0.12;
  }

  return totalFees.toFixed(2);
};
