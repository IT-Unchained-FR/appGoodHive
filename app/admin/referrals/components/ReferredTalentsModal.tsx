"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { renderTalentApprovalBadge, getTalentApprovalStatus } from "@/app/components/admin/sharedTalentColumns";
import { ProfileData } from "@/app/talents/my-profile/page";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/app/components/admin/StatusPill";

interface ReferredTalentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode: string | null;
  referrerName: string | null;
}

export function ReferredTalentsModal({
  open,
  onOpenChange,
  referralCode,
  referrerName,
}: ReferredTalentsModalProps) {
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && referralCode) {
      setLoading(true);
      fetch(`/api/admin/referrals/details?code=${encodeURIComponent(referralCode)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTalents(data.data || []);
          } else {
            console.error("Failed to load referred talents:", data.error);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setTalents([]);
    }
  }, [open, referralCode]);

  const getRoles = (t: any) => {
    const roles = [];
    if (t.talent) roles.push("Talent");
    if (t.mentor) roles.push("Mentor");
    if (t.recruiter) roles.push("Recruiter");
    if (roles.length === 0) return "User";
    return roles.join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50">
          <DialogTitle className="text-lg">
            Users Referred by {referrerName || "this user"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : talents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No referred users found.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Signed Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {talents.map((t, idx) => {
                    const fullName = `${t.first_name || ""} ${t.last_name || ""}`.trim();
                    const status = getTalentApprovalStatus(t);

                    return (
                      <tr key={t.user_id || idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {t.image_url ? (
                                <Image
                                  src={t.image_url}
                                  alt={fullName}
                                  width={32}
                                  height={32}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {t.first_name?.[0]}
                                  {t.last_name?.[0]}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              {t.user_id ? (
                                <Link
                                  href={`/admin/talent/${t.user_id}`}
                                  target="_blank"
                                  className="truncate font-medium text-slate-900 hover:text-blue-600 hover:underline"
                                >
                                  {fullName || "Unnamed User"}
                                </Link>
                              ) : (
                                <p className="truncate font-medium text-slate-900">
                                  {fullName || "Unnamed User"}
                                </p>
                              )}
                              <p className="truncate text-xs text-slate-500">
                                {t.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {getRoles(t)}
                        </td>
                        <td className="px-4 py-3">
                          {status === "approved" ? (
                            <StatusPill status="approved" label="Approved" />
                          ) : status === "deferred" ? (
                            <StatusPill status="deferred" label="Deferred" />
                          ) : status === "rejected" ? (
                            <StatusPill status="rejected" label="Rejected" />
                          ) : (
                            <StatusPill status="in_review" label="In Review" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
