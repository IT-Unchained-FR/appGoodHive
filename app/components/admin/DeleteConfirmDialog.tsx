"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-semibold mb-2">
              You are about to permanently delete:
            </p>
            <p className="text-sm text-red-900 font-mono bg-white px-2 py-1 rounded break-all">
              {entityName}
            </p>

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

          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              Type <span className="font-mono font-bold">DELETE</span> to
              confirm:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="font-mono"
              disabled={loading}
            />
          </div>

          <p className="text-xs text-gray-600">
            This action cannot be undone. All data will be permanently removed
            from the database.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={confirmText.toLowerCase() !== "delete" || loading}
          >
            {loading ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
