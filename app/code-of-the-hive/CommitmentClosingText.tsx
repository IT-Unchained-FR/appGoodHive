"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

/**
 * Renders "You Gave Your Word" for members who have already signed the Code,
 * and "I give my word." for everyone else. Falls back to "I give my word."
 * during SSR and while the status is loading so the page never flickers.
 */
export function CommitmentClosingText() {
  const { isAuthenticated } = useAuth();
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();

    fetch("/api/talents/code-of-hive", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.signed) setHasSigned(true);
      })
      .catch(() => {
        // Silently ignore — default text is fine.
      });

    return () => controller.abort();
  }, [isAuthenticated]);

  return <>{hasSigned ? "You Gave Your Word." : "I give my word."}</>;
}
