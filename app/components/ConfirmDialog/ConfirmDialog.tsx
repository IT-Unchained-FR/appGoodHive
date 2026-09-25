"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, HelpCircle } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive or irreversible actions (red confirm button). */
  tone?: "default" | "danger";
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Styled replacement for window.confirm.
 *
 *   const [confirm, confirmDialog] = useConfirm();
 *   if (!(await confirm({ title: "Close job?" }))) return;
 *   ...
 *   return <>{...}{confirmDialog}</>;
 */
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // A second confirm while one is open cancels the first.
        pendingRef.current?.resolve(false);
        const next = { ...options, resolve };
        pendingRef.current = next;
        setPending(next);
      }),
    [],
  );

  const settle = (confirmed: boolean) => {
    pendingRef.current?.resolve(confirmed);
    pendingRef.current = null;
    setPending(null);
  };

  const isDanger = pending?.tone === "danger";
  const Icon = isDanger ? AlertTriangle : HelpCircle;

  const dialog = (
    <DialogPrimitive.Root open={pending !== null} onOpenChange={(open) => !open && settle(false)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[10050] bg-gray-900/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[10051] w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(17,24,39,0.35)] ring-1 ring-black/5 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isDanger ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <DialogPrimitive.Title className="text-lg font-semibold leading-snug text-gray-900">
                  {pending?.title}
                </DialogPrimitive.Title>
                {pending?.description ? (
                  <DialogPrimitive.Description asChild>
                    <div className="mt-2 text-sm leading-relaxed text-gray-600">
                      {pending.description}
                    </div>
                  </DialogPrimitive.Description>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => settle(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {pending?.cancelLabel ?? "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => settle(true)}
              className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isDanger
                  ? "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-400"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 focus-visible:ring-amber-400"
              }`}
            >
              {pending?.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );

  return [confirm, dialog];
}
