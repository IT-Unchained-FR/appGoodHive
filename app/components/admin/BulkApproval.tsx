"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface BulkApprovalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: any[];
  entityType: "talent" | "company";
  onApprove: (itemIds: string[], approvalTypes?: Record<string, boolean>) => Promise<void>;
  onReject: (itemIds: string[], reason?: string) => Promise<void>;
}

export function BulkApproval({
  open,
  onOpenChange,
  selectedItems,
  entityType,
  onApprove,
  onReject,
}: BulkApprovalProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalTypes, setApprovalTypes] = useState({
    talent: false,
    mentor: false,
    recruiter: false,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAction(null);
      setRejectionReason("");
    }
    onOpenChange(nextOpen);
  };

  const handleApprove = async () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected");
      return;
    }

    try {
      setLoading(true);
      const itemIds = selectedItems.map((item) => item.user_id || item.id);
      
      if (entityType === "talent") {
        await onApprove(itemIds, approvalTypes);
      } else {
        await onApprove(itemIds);
      }
      
      toast.success(`Successfully approved ${selectedItems.length} ${entityType}(s)`);
      onOpenChange(false);
      setAction(null);
    } catch (error) {
      toast.error("Failed to approve items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected");
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setLoading(true);
      const itemIds = selectedItems.map((item) => item.user_id || item.id);
      await onReject(itemIds, rejectionReason);
      toast.success(`Successfully rejected ${selectedItems.length} ${entityType}(s)`);
      onOpenChange(false);
      setAction(null);
      setRejectionReason("");
    } catch (error) {
      toast.error("Failed to reject items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="border-b border-gray-100 px-6 pb-4 pt-6">
          <DialogTitle className="text-base font-bold text-gray-900">
            Bulk Action
          </DialogTitle>
          <p className="mt-0.5 text-xs text-gray-400">
            {selectedItems.length} {entityType}(s) selected
          </p>
        </div>

        <div>
          {!action && (
            <div className="space-y-3 px-6 py-5">
              <p className="text-sm text-gray-600">
                Choose an action for {selectedItems.length} selected{" "}
                {entityType}(s):
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setAction("approve")}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-green-100 bg-green-50 p-4 text-left transition-all hover:border-green-300 hover:bg-green-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Approve All
                    </p>
                    <p className="text-xs text-green-600">
                      Grant access to all selected
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setAction("reject")}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-red-100 bg-red-50 p-4 text-left transition-all hover:border-red-300 hover:bg-red-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Reject All
                    </p>
                    <p className="text-xs text-red-500">
                      Decline all selected
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {action === "approve" && entityType === "talent" && (
            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Approve {selectedItems.length} talent(s)
                </span>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Roles to approve
                </p>
                <div className="divide-y divide-gray-100 rounded-xl bg-gray-50">
                  {(["talent", "mentor", "recruiter"] as const).map((role) => (
                    <div
                      key={role}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <span className="text-sm font-medium capitalize text-gray-700">
                        {role}
                      </span>
                      <Switch
                        checked={approvalTypes[role]}
                        onCheckedChange={(checked) =>
                          setApprovalTypes({ ...approvalTypes, [role]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed text-amber-800">
                  This will approve all {selectedItems.length} selected{" "}
                  {entityType}(s). This action cannot be undone.
                </p>
              </div>
            </div>
          )}

          {action === "reject" && (
            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Reject {selectedItems.length} {entityType}(s)
                </span>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="min-h-[100px] resize-none rounded-xl border-gray-200 text-sm focus:ring-[#FFC905]"
                />
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                <p className="text-xs leading-relaxed text-red-700">
                  This will reject all {selectedItems.length} selected{" "}
                  {entityType}(s). This action cannot be undone.
                </p>
              </div>
            </div>
          )}

          {action === "approve" && entityType === "company" && (
            <div className="space-y-4 px-6 py-5">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Approve {selectedItems.length} company(s)
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed text-amber-800">
                  This will approve all {selectedItems.length} selected{" "}
                  {entityType}(s). This action cannot be undone.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 pb-6 pt-4 sm:flex-row">
          {action && (
            <Button
              variant="outline"
              className="rounded-xl h-10 sm:mr-auto"
              onClick={() => {
                setAction(null);
                setRejectionReason("");
              }}
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-xl h-10"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {action === "approve" && (
            <Button
              className="rounded-xl h-10 bg-[#FFC905] font-semibold text-black hover:bg-[#e6b400]"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? "Approving..." : `Approve ${selectedItems.length}`}
            </Button>
          )}
          {action === "reject" && (
            <Button
              className="rounded-xl h-10 bg-red-500 font-semibold text-white hover:bg-red-600"
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? "Rejecting..." : `Reject ${selectedItems.length}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
