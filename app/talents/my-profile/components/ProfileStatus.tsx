import { ProfileData } from "../types";

interface ProfileStatusProps {
  profileData: ProfileData;
}

export const ProfileStatus = ({ profileData }: ProfileStatusProps) => {
  const unapprovedProfile =
    profileData?.approved === false && profileData.inreview === true;
  const savedProfile =
    profileData?.approved === false && profileData.inreview === false;

  if (!unapprovedProfile && !savedProfile) return null;

  return (
    <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
      {unapprovedProfile
        ? "🚀 Your profile is pending approval. Check your email to schedule your interview."
        : "🚀 Profile saved! Complete the mandatory fields and submit for review when ready."}
    </p>
  );
};
