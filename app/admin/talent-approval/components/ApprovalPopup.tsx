"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProfileData } from "@/app/talents/my-profile/page";
import toast from "react-hot-toast";

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
      toast.error("Failed to approve user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(user, "user");
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Approve as</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="mentor" className="flex flex-col">
                <span className="text-base">Mentor</span>
                <span className="text-sm text-muted-foreground">
                  Approve as a mentor{" "}
                  {user.mentor && !superView ? " (Applied For)" : ""}
                </span>
              </Label>
              <Switch
                id="mentor"
                checked={approvalTypes.mentor}
                onCheckedChange={() => handleApprovalChange("mentor")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="talent" className="flex flex-col">
                <span className="text-base">Talent</span>
                <span className="text-sm text-muted-foreground">
                  Approve as a talent{" "}
                  {user.talent && !superView ? " (Applied For)" : ""}
                </span>
              </Label>
              <Switch
                id="talent"
                checked={approvalTypes.talent}
                onCheckedChange={() => handleApprovalChange("talent")}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="recruiter" className="flex flex-col">
              <span className="text-base">Recruiter</span>
              <span className="text-sm text-muted-foreground">
                Approve as a recruiter{" "}
                {user.recruiter && !superView ? " (Applied For)" : ""}
              </span>
            </Label>
            <Switch
              id="recruiter"
              checked={approvalTypes.recruiter}
              onCheckedChange={() => handleApprovalChange("recruiter")}
            />
          </div>
        </div>
        <Button onClick={handleApprove} disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing...
            </div>
          ) : (
            "Approve"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
