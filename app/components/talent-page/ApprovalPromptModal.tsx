"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ApprovalPromptModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ApprovalPromptModal({ open, onClose }: ApprovalPromptModalProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <CheckCircle className="h-5 w-5 text-amber-600" />
            Get Approved
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            To unlock contact details and social links, submit your profile for review.
          </p>
          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => handleNavigate("/companies/my-profile")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Company Profile
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => handleNavigate("/talents/my-profile")}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Talent Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
