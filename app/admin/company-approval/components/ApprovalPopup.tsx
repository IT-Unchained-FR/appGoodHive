"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface Company {
  user_id: string;
  headline?: string;
  email?: string;
  city?: string;
  country?: string;
  designation?: string;
  approved?: boolean;
  inReview?: boolean;
}

type ApprovalPopupProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: Company;
  fetchData: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

export default function ApprovalPopup({
  open,
  setOpen,
  user,
  fetchData,
  setLoading,
  loading,
}: ApprovalPopupProps) {
  const handleApprove = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/companies/pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve company.`);
      }

      toast.success("Company approved successfully");
      fetchData();

      setOpen(false);
    } catch (error) {
      toast.error("Failed to approve company.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Approve Company</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          Are you sure you want to approve{" "}
          {user?.headline?.replace(/<[^>]*>?/gm, "")}?
        </div>
        <Button
          onClick={handleApprove}
          disabled={loading}
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
        >
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
