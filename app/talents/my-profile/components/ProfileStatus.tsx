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
        ? "⏳ Profile submitted for review. You'll get an email once it's approved."
        : "✅ Profile saved. Complete required fields and submit for review to get verified."}
    </p>
  );
};
