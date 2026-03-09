"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  AVAILABILITY_STATUS_OPTIONS,
  type AvailabilityStatus,
  getAvailabilityLabel,
  normalizeAvailabilityStatus,
} from "@/app/constants/availability";

interface AvailabilityPickerProps {
  value?: string | null;
  legacyAvailability?: boolean | string | null;
  updatedAt?: string | Date | null;
  disabled?: boolean;
  onSaved?: (nextStatus: AvailabilityStatus, updatedAt: string) => void;
}

export function AvailabilityPicker({
  value,
  legacyAvailability,
  updatedAt,
  disabled = false,
  onSaved,
}: AvailabilityPickerProps) {
  const initialStatus = useMemo(
    () => normalizeAvailabilityStatus(value, legacyAvailability),
    [value, legacyAvailability],
  );
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>(initialStatus);
  const [savedStatus, setSavedStatus] = useState<AvailabilityStatus>(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | Date | null>(updatedAt ?? null);

  useEffect(() => {
    const normalized = normalizeAvailabilityStatus(value, legacyAvailability);
    setSelectedStatus(normalized);
    setSavedStatus(normalized);
  }, [legacyAvailability, value]);

  useEffect(() => {
    setLastUpdatedAt(updatedAt ?? null);
  }, [updatedAt]);

  const hasChanges = selectedStatus !== savedStatus;

  const handleSave = async () => {
    if (!hasChanges || disabled) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile/availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        data?: { status?: AvailabilityStatus; updatedAt?: string };
      };

      if (!response.ok || !payload?.success || !payload?.data?.status || !payload?.data?.updatedAt) {
        throw new Error(payload?.error || "Failed to save availability");
      }

      setSavedStatus(payload.data.status);
      setSelectedStatus(payload.data.status);
      setLastUpdatedAt(payload.data.updatedAt);
      onSaved?.(payload.data.status, payload.data.updatedAt);
      toast.success(`Availability updated: ${getAvailabilityLabel(payload.data.status)}`);
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update availability");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Availability status
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value as AvailabilityStatus)}
          disabled={disabled || isSaving}
          className="form-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 sm:max-w-[320px]"
        >
          {AVAILABILITY_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || isSaving || !hasChanges}
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      {lastUpdatedAt && (
        <p className="text-xs text-slate-500">
          Last updated: {new Date(lastUpdatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
