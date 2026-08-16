"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hexagon, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CodeOfHiveAdminPanelProps {
  userId: string;
  signed: boolean;
  signedAt?: string | Date | null;
  version?: string | null;
  cohort?: string | null;
}

const formatSignedAt = (value?: string | Date | null) => {
  if (!value) return "Unknown";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CodeOfHiveAdminPanel({
  userId,
  signed,
  signedAt,
  version,
  cohort,
}: CodeOfHiveAdminPanelProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);

    try {
      const response = await fetch("/api/admin/talents/code-of-hive", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to revoke the badge");
      }

      toast.success("Code of the Hive badge revoked.");
      setIsConfirmOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke the badge",
      );
    } finally {
      setIsRevoking(false);
    }
  };

  if (!signed) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <Hexagon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">
            Code of the Hive
          </p>
          <p className="mt-0.5 text-sm text-slate-500">
            Not signed. No badge on this profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Hexagon className="h-4 w-4 fill-amber-500 text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">
            Code of the Hive — signed
          </p>
          <dl className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="flex gap-2">
              <dt className="text-slate-400">Signed</dt>
              <dd className="font-medium text-slate-700">
                {formatSignedAt(signedAt)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-400">Version</dt>
              <dd className="font-medium text-slate-700">{version ?? "Unknown"}</dd>
            </div>
            {cohort ? (
              <div className="flex gap-2">
                <dt className="text-slate-400">Cohort</dt>
                <dd className="font-medium text-slate-700">{cohort}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setIsConfirmOpen(true)}
        className="h-10 w-full justify-between rounded-2xl border-red-200 px-4 text-red-700 hover:bg-red-50 hover:text-red-800"
      >
        Revoke badge
        <ShieldOff className="h-4 w-4" />
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke this badge?</DialogTitle>
            <DialogDescription>
              The Code of the Hive badge will be removed from this Talent&apos;s
              public profile and their signature record will be cleared. They can
              sign the Code again afterwards.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isRevoking ? "Revoking…" : "Revoke badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
