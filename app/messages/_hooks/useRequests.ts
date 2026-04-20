"use client";

import type { JobRequest, JobRequestStatus } from "@/interfaces/messenger";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

interface UseRequestsReturn {
  requests: JobRequest[];
  isLoading: boolean;
  fetchRequests: () => Promise<void>;
  updateStatus: (requestId: string, status: JobRequestStatus) => Promise<void>;
}

// Manages job requests. Fetched on mount and after status mutations.
// No polling loop — requests are stable data that only change on user action.
export function useRequests(userId: string | undefined): UseRequestsReturn {
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const failureCountRef = useRef(0);
  const authToastShownRef = useRef(false);

  const fetchRequests = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/job-requests?role=both`, { cache: "no-store" });
      if (res.status === 401) {
        if (!authToastShownRef.current) {
          toast.error("Please log in again to load your requests.");
          authToastShownRef.current = true;
        }
        setRequests([]);
        failureCountRef.current = 0;
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: { requests: JobRequest[] };
        requests?: JobRequest[];
      };
      const list =
        json.data?.requests ??
        (json as { requests?: JobRequest[] }).requests ??
        [];
      setRequests(list);
      failureCountRef.current = 0;
      authToastShownRef.current = false;
    } catch {
      failureCountRef.current += 1;
      if (failureCountRef.current >= 3) {
        toast.error("Could not load requests. Check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updateStatus = useCallback(
    async (requestId: string, status: JobRequestStatus) => {
      // Optimistic update
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r)),
      );

      try {
        const res = await fetch(`/api/job-requests/${requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch {
        // Revert on failure by re-fetching
        toast.error("Failed to update request status.");
        await fetchRequests();
      }
    },
    [fetchRequests],
  );

  return { requests, isLoading, fetchRequests, updateStatus };
}
