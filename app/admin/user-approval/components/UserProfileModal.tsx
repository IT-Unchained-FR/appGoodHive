import { User } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ApprovalToggle } from "./ApprovalToggle";
import { ProfileData } from "@/app/talents/my-profile/page";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface UserProfileModalProps {
  user: ProfileData;
  onClose: () => void;
  onUpdateRoles: (
    userId: number,
    roles: { talent: boolean; recruiter: boolean; mentor: boolean },
  ) => void;
}

export function UserProfileModal({
  user,
  onClose,
  onUpdateRoles,
}: UserProfileModalProps) {
  const handleRoleChange = (role: "talent" | "recruiter" | "mentor") => {
    // const newRoles = { ...user.roles, [role]: !user.roles[role] };
    // onUpdateRoles(user.id, newRoles);
  };

  const initialUser = user;
  const [finalUser, setFinalUser] = useState(initialUser);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            User Profile
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="name"
              className="text-right font-semibold text-gray-600"
            >
              Name
            </Label>
            <div id="name" className="col-span-3 text-gray-800">
              {user.first_name} {user.last_name}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="email"
              className="text-right font-semibold text-gray-600"
            >
              Email
            </Label>
            <div id="email" className="col-span-3 text-gray-800">
              {user.email}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="cvUrl"
              className="text-right font-semibold text-gray-600"
            >
              CV URL
            </Label>
            <div id="requestDate" className="col-span-3 text-gray-800">
              <Button
                onClick={() => {
                  window.open(user.cv_url, "_blank");
                }}
              >
                View CV
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="cvUrl"
              className="text-right font-semibold text-gray-600"
            >
              PRIVATE PROFILE
            </Label>
            <div id="requestDate" className="col-span-3 text-gray-800">
              <Button
                onClick={() => {
                  window.open(user.cv_url, "_blank");
                }}
              >
                View CV
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="status"
              className="text-right font-semibold text-gray-600"
            >
              Telegram
            </Label>
            <div id="status" className="col-span-3">
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                {user.telegram}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-semibold text-gray-600">
              Roles
            </Label>
            <div className="col-span-3 space-y-2">
              <ApprovalToggle
                label="Talent"
                checked={user.talent as boolean}
                onToggle={() => handleRoleChange("talent")}
              />
              <ApprovalToggle
                label="Recruiter"
                checked={user.recruiter as boolean}
                onToggle={() => handleRoleChange("recruiter")}
              />
              <ApprovalToggle
                label="Mentor"
                checked={user.mentor as boolean}
                onToggle={() => handleRoleChange("mentor")}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
