"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, X } from "lucide-react";
import { useEffect, useState } from "react";

interface DateRangeFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  onDateRangeChange?: (
    startDate: string | null,
    endDate: string | null,
  ) => void;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
  label?: string;
}

export function DateRangeFilter({
  value,
  onChange,
  onDateRangeChange,
  initialStartDate = null,
  initialEndDate = null,
  label = "Date Range",
}: DateRangeFilterProps) {
  // Parse value prop if provided (format: "startDate,endDate" or preset like "1d", "7d")
  const parseValue = (
    val: string | undefined,
  ): { start: string; end: string } => {
    if (!val || val === "any") return { start: "", end: "" };
    if (val.includes(",")) {
      const [start, end] = val.split(",");
      return { start: start || "", end: end || "" };
    }
    return { start: "", end: "" };
  };

  const parsed = parseValue(value);
  // Get today's date in YYYY-MM-DD format (helper function)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState<string>(
    initialStartDate || parsed.start || "",
  );
  const [endDate, setEndDate] = useState<string>(
    initialEndDate || parsed.end || getTodayDate(),
  );

  // Track if we're in custom mode (when user explicitly selects "custom")
  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    // If value contains a comma, it's a custom range
    // If value is undefined or empty, default to custom mode
    if (!value || value === "any") return false;
    return value.includes(",");
  });

  // Sync with value prop changes
  useEffect(() => {
    if (value !== undefined) {
      const parsed = parseValue(value);
      const hasCustomRange = value.includes(",");

      // Update custom mode based on value
      if (hasCustomRange) {
        setIsCustomMode(true);
      } else if (value && value !== "any") {
        setIsCustomMode(false);
      }

      setStartDate((prevStart) => {
        if (parsed.start !== prevStart) {
          return parsed.start;
        }
        return prevStart;
      });
      setEndDate((prevEnd) => {
        // If we have a parsed end date, use it
        if (parsed.end) {
          return parsed.end;
        }
        // If we're in custom mode and no end date, default to today
        if (hasCustomRange && !parsed.end && !prevEnd) {
          return getTodayDate();
        }
        // Otherwise keep the previous value or default to today
        return prevEnd || getTodayDate();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleStartDateChange = (newValue: string) => {
    setStartDate(newValue);
    setIsCustomMode(true); // Ensure we're in custom mode when dates are changed

    // If no end date is set, default to today
    const newEndDate = endDate || getTodayDate();
    if (!endDate) {
      setEndDate(newEndDate);
    }

    const dateRange =
      newValue && newEndDate
        ? `${newValue},${newEndDate}`
        : newValue
          ? `${newValue},${newEndDate}`
          : newEndDate
            ? `,${newEndDate}`
            : "any";

    if (onChange) {
      onChange(dateRange);
    }
    if (onDateRangeChange) {
      onDateRangeChange(newValue || null, newEndDate || null);
    }
  };

  const handleEndDateChange = (newValue: string) => {
    setEndDate(newValue);
    setIsCustomMode(true); // Ensure we're in custom mode when dates are changed

    const dateRange =
      startDate && newValue
        ? `${startDate},${newValue}`
        : startDate
          ? startDate
          : newValue
            ? `,${newValue}`
            : "any";

    if (onChange) {
      onChange(dateRange);
    }
    if (onDateRangeChange) {
      onDateRangeChange(startDate || null, newValue || null);
    }
  };

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
    setIsCustomMode(false);
    if (onChange) {
      onChange("any");
    }
    if (onDateRangeChange) {
      onDateRangeChange(null, null);
    }
  };

  const hasActiveFilter = startDate || endDate;

  // Handle preset ranges (1d, 3d, 7d, etc.)
  const isPresetRange = value && !value.includes(",") && value !== "any";
  // Use isCustomMode state to determine if we should show custom inputs
  // If we have a custom range (contains comma) or we're in custom mode, show as custom
  const hasCustomRange = value && value.includes(",");
  const presetValue =
    isCustomMode || hasCustomRange ? "custom" : isPresetRange ? value : "any";

  const handlePresetChange = (preset: string) => {
    if (preset === "custom") {
      // Switch to custom mode - show date inputs
      setIsCustomMode(true);

      // If no end date is set, default to today
      const newEndDate = endDate || getTodayDate();
      if (!endDate) {
        setEndDate(newEndDate);
      }

      // If we have dates, format them as custom range
      const dateRange =
        startDate && newEndDate
          ? `${startDate},${newEndDate}`
          : startDate
            ? `${startDate},${newEndDate}`
            : newEndDate
              ? `,${newEndDate}`
              : "";

      if (onChange && dateRange) {
        onChange(dateRange);
      }

      // Also update via onDateRangeChange if provided
      if (onDateRangeChange) {
        onDateRangeChange(startDate || null, newEndDate || null);
      }
      return;
    }
    if (preset === "any") {
      setIsCustomMode(false);
      clearDates();
      return;
    }
    setIsCustomMode(false);
    if (onChange) {
      onChange(preset);
    }
  };

  const presetOptions = [
    { value: "any", label: "Any time" },
    { value: "1d", label: "Last 24 hours" },
    { value: "3d", label: "Last 3 days" },
    { value: "7d", label: "Last 7 days" },
    { value: "14d", label: "Last 14 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "custom", label: "Custom range" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={presetValue} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(presetValue === "custom" || isCustomMode) && (
        <div className="flex items-center gap-2 min-w-[200px]">
          <div className="relative flex-1">
            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <span className="text-gray-400">to</span>
          <div className="relative flex-1">
            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="pl-8"
            />
          </div>
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearDates}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {hasActiveFilter && (presetValue === "custom" || isCustomMode) && (
        <Badge variant="secondary" className="gap-1">
          {startDate && endDate
            ? `${startDate} - ${endDate}`
            : startDate
              ? `From ${startDate}`
              : `Until ${endDate}`}
        </Badge>
      )}
    </div>
  );
}
