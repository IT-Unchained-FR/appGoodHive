"use client";

import { Loader2, Paperclip, SendHorizonal } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FileAttachmentPreview } from "./FileAttachmentPreview";

const MAX_MESSAGE_LENGTH = 5000;

interface MessageComposerProps {
  value: string;
  onChange: (text: string) => void;
  onSend: (attachmentUrl?: string) => void;
  isSending: boolean;
  disabled?: boolean;
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  isSending,
  disabled = false,
}: MessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachmentUrl, setPendingAttachmentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const charCount = value.length;
  const isNearLimit = charCount >= 4500;
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;
  const canSend =
    !disabled &&
    !isSending &&
    !isUploading &&
    !isOverLimit &&
    (value.trim().length > 0 || !!pendingAttachmentUrl);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleSend = () => {
    const attachment = pendingAttachmentUrl ?? undefined;
    setPendingAttachmentUrl(null);
    onSend(attachment);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target.files) return;
    // Reset input so the same file can be re-selected
    e.target.value = "";
    if (!file) return;

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress (S3 upload doesn't expose real progress via fetch)
    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 20, 85));
    }, 300);

    try {
      const res = await fetch("/api/upload-file", { method: "POST", body: formData });
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
      const json = (await res.json()) as { fileUrl?: string; error?: string };
      if (!json.fileUrl) throw new Error(json.error ?? "No file URL returned");
      setPendingAttachmentUrl(json.fileUrl);
    } catch (err) {
      clearInterval(progressTimer);
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-slate-200 bg-white px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]">
      {/* Attachment preview */}
      {pendingAttachmentUrl && (
        <div className="mb-2 px-1">
          <FileAttachmentPreview
            url={pendingAttachmentUrl}
            onRemove={() => setPendingAttachmentUrl(null)}
          />
        </div>
      )}

      {/* Upload progress bar */}
      {isUploading && (
        <div className="mb-2 h-0.5 w-full overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="mb-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:border-amber-400 hover:text-amber-600 disabled:opacity-40"
          title="Attach file"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:opacity-50"
          style={{ minHeight: "44px", maxHeight: "9rem" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
          }}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="mb-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#FFC905] text-slate-900 shadow-sm transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Character counter */}
      {charCount > 4000 && (
        <p
          className={`mt-1 text-right text-[11px] ${
            isOverLimit
              ? "text-rose-600"
              : isNearLimit
                ? "text-amber-600"
                : "text-slate-400"
          }`}
        >
          {charCount} / {MAX_MESSAGE_LENGTH}
        </p>
      )}
    </div>
  );
}
