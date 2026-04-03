"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { XCircle, AlertCircle } from "lucide-react";

interface RejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onConfirm: (reason: string) => Promise<void>;
  loading?: boolean;
}

export function RejectionModal({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  loading = false,
}: RejectionModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setRejectionReason("");
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      return;
    }

    try {
      await onConfirm(rejectionReason);
      setRejectionReason("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error rejecting:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0">
        <div className="border-b border-gray-100 px-6 pb-4 pt-6">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900">
              Reject {itemName ? `"${itemName}"` : "Application"}
            </DialogTitle>
          </div>
          <p className="ml-11 text-xs text-gray-400">
            This reason will be sent to the applicant
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <label
                htmlFor="rejection-reason"
                className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Rejection Reason <span className="text-red-400">*</span>
              </label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this application is being rejected. Be specific — this message is sent to the applicant."
              className="min-h-[120px] resize-none rounded-xl border-gray-200 text-sm focus:border-[#FFC905] focus:ring-[#FFC905]"
              maxLength={500}
              required
            />
              <p className="text-xs text-gray-400">
                {rejectionReason.length}/500 characters
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <p className="text-xs leading-relaxed text-red-700">
                This action cannot be undone. The applicant will be notified
                with the reason above.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 pb-6 pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl"
              onClick={() => {
                setRejectionReason("");
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 flex-1 rounded-xl bg-red-500 font-semibold text-white hover:bg-red-600"
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Rejecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Confirm Rejection
                </span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
