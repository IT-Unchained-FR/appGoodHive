"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  entityType: "user" | "talent" | "company" | "job";
  entityName: string; // email or title
  entityId: string;
  relatedData?: {
    talents?: number;
    companies?: number;
    jobs?: number;
  };
  loading: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  entityType,
  entityName,
  entityId,
  relatedData,
  loading,
}: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = async () => {
    await onConfirm();
    setConfirmText(""); // Reset after successful delete
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText(""); // Reset when closing
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0">
        <div className="border-b border-gray-100 px-6 pb-4 pt-6">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900">
              Delete {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
            </DialogTitle>
          </div>
          <p className="ml-11 text-xs text-red-400">
            This action is permanent and cannot be undone
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-red-800 font-semibold mb-2">
              You are about to permanently delete:
            </p>
            <div className="text-sm text-red-900 bg-white px-3 py-2 rounded break-all space-y-1">
              {entityName?.trim() ? (
                <p>
                  <span className="font-semibold text-red-700">Email/Name:</span>{" "}
                  <span className="font-mono">{entityName}</span>
                </p>
              ) : null}
              {entityId?.trim() ? (
                <p>
                  <span className="font-semibold text-red-700">User ID:</span>{" "}
                  <span className="font-mono">{entityId}</span>
                </p>
              ) : null}
              {!entityName?.trim() && !entityId?.trim() ? (
                <p className="font-mono">Unknown record</p>
              ) : null}
            </div>

            {relatedData &&
              (relatedData.talents ||
                relatedData.companies ||
                relatedData.jobs) && (
                <div className="mt-3 pt-3 border-t border-red-300">
                  <p className="text-xs text-red-700 font-semibold mb-1">
                    This will also delete:
                  </p>
                  <ul className="text-xs text-red-800 space-y-1">
                    {relatedData.talents ? (
                      <li>• {relatedData.talents} talent profile(s)</li>
                    ) : null}
                    {relatedData.companies ? (
                      <li>• {relatedData.companies} company profile(s)</li>
                    ) : null}
                    {relatedData.jobs ? (
                      <li>• {relatedData.jobs} job posting(s)</li>
                    ) : null}
                  </ul>
                </div>
              )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="confirm-delete"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Type <span className="font-mono font-bold text-gray-700">DELETE</span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="h-10 rounded-xl border-gray-200 font-mono focus:border-red-300 focus:ring-red-300"
              disabled={loading}
            />
          </div>

          <p className="text-xs text-gray-600">
            This action cannot be undone. All data will be permanently removed
            from the database.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 pb-6 pt-4 sm:flex-row">
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-xl"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="h-10 flex-1 rounded-xl bg-red-500 font-semibold text-white hover:bg-red-600"
            onClick={handleConfirm}
            disabled={confirmText.toLowerCase() !== "delete" || loading}
          >
            {loading ? "Deleting..." : "Delete Permanently"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
