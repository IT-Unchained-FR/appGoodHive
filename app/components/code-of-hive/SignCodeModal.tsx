"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CODE_OF_HIVE_COPY } from "@/app/constants/code-of-hive";

interface SignCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSigning: boolean;
}

export function SignCodeModal({
  open,
  onOpenChange,
  onConfirm,
  isSigning,
}: SignCodeModalProps) {
  return (
    <Dialog open={open} onOpenChange={isSigning ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {CODE_OF_HIVE_COPY.modalTitle}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {CODE_OF_HIVE_COPY.modalBody}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSigning}
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {CODE_OF_HIVE_COPY.modalCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSigning}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#1a1333] px-6 text-sm font-semibold text-[#fdf6e3] transition hover:bg-[#2a1f4d] disabled:opacity-60"
          >
            {isSigning ? "Signing…" : CODE_OF_HIVE_COPY.modalConfirm}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SignCodeModal;
