import { useCallback, useEffect, useState } from "react";
import { ProfileData } from "../types";

export const useProfileData = (user_id: string) => {
  const [profileData, setProfileData] = useState<ProfileData>(
    {} as ProfileData,
  );
  const [user, setUser] = useState<any>(null);
  const [isProfileDataFetching, setIsProfileDataFetching] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user_id) return;

    try {
      setIsProfileDataFetching(true);
      const response = await fetch(
        `/api/talents/my-profile?user_id=${user_id}`,
      );

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsProfileDataFetching(false);
    }
  }, [user_id]);

  const fetchUser = useCallback(async () => {
    if (!user_id) return;

    try {
      const response = await fetch(`/api/profile?user_id=${user_id}`);
      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }, [user_id]);

  // Initial data load
  useEffect(() => {
    if (!user_id) return;

    const initializeData = async () => {
      await Promise.all([fetchProfile(), fetchUser()]);
    };

    initializeData();
  }, [user_id, fetchProfile, fetchUser]);

  return {
    profileData,
    setProfileData,
    user,
    isProfileDataFetching,
    fetchProfile,
  };
};
