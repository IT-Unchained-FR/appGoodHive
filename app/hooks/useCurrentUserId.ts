"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { AUTH_CHANGED_EVENT } from "@/app/utils/authEvents";
import Cookies from "js-cookie";
import { useCallback, useEffect, useState } from "react";

export function useCurrentUserId() {
  const { user, isAuthenticated } = useAuth();
  const [cookieUserId, setCookieUserId] = useState<string | undefined>(() =>
    Cookies.get("user_id"),
  );

  const syncCookieUserId = useCallback(() => {
    setCookieUserId(Cookies.get("user_id"));
  }, []);

  useEffect(() => {
    syncCookieUserId();

    const handleAuthChanged = () => {
      syncCookieUserId();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, [syncCookieUserId]);

  useEffect(() => {
    syncCookieUserId();
  }, [isAuthenticated, user?.user_id, syncCookieUserId]);

  return user?.user_id || cookieUserId;
}
