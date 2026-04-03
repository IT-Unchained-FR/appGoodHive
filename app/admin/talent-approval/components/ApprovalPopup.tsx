"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ProfileData } from "@/app/talents/my-profile/page";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type ApprovalTypes = {
  mentor: boolean;
  talent: boolean;
  recruiter: boolean;
};

type ApprovalPopupProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: ProfileData;
  fetchData: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  superView?: boolean;
};

export default function ApprovalPopup({
  open,
  setOpen,
  user,
  fetchData,
  setLoading,
  loading,
  superView,
}: ApprovalPopupProps) {
  const [approvalTypes, setApprovalTypes] = useState<ApprovalTypes>({
    mentor: false,
    talent: false,
    recruiter: false,
  });

  const handleApprovalChange = (type: keyof ApprovalTypes) => {
    setApprovalTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/talents/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          referral_code: user.referred_by,
          approvalTypes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve user.`);
      }

      toast.success("User approved successfully");
      fetchData();

      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Failed to approve user: ${error.message}`
          : "Failed to approve user. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setApprovalTypes({
        mentor: user.mentor ? true : false,
        talent: user.talent ? true : false,
        recruiter: user.recruiter ? true : false,
      });
    }
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] p-0">
        <div className="border-b border-gray-100 px-6 pb-4 pt-6">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900">
              Approve Talent
            </DialogTitle>
          </div>
          <p className="ml-11 text-xs text-gray-400">
            Grant platform access for the selected roles
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#FFC905]">
              <span className="text-xs font-bold text-black">
                {(user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "")}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="truncate text-xs text-gray-400">
                {user.email ?? ""}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Select roles to approve
            </p>
            <div className="divide-y divide-gray-100 rounded-xl bg-gray-50">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">Talent</p>
                  <p className="text-xs text-gray-400">
                    {user.talent && !superView
                      ? "Applied for this role"
                      : "Approve as a talent"}
                  </p>
                </div>
                <Switch
                  checked={approvalTypes.talent}
                  onCheckedChange={() => handleApprovalChange("talent")}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">Mentor</p>
                  <p className="text-xs text-gray-400">
                    {user.mentor && !superView
                      ? "Applied for this role"
                      : "Approve as a mentor"}
                  </p>
                </div>
                <Switch
                  checked={approvalTypes.mentor}
                  onCheckedChange={() => handleApprovalChange("mentor")}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Recruiter
                  </p>
                  <p className="text-xs text-gray-400">
                    {user.recruiter && !superView
                      ? "Applied for this role"
                      : "Approve as a recruiter"}
                  </p>
                </div>
                <Switch
                  checked={approvalTypes.recruiter}
                  onCheckedChange={() => handleApprovalChange("recruiter")}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-amber-800">
              This will grant the selected roles and platform access. Verify all
              details before confirming.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 pb-6 pt-4 sm:flex-row">
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-xl"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="h-10 flex-1 rounded-xl bg-[#FFC905] font-semibold text-black hover:bg-[#e6b400]"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
