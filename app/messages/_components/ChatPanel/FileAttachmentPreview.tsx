import Image from "next/image";
import { Paperclip, X } from "lucide-react";
import { filenameFromUrl, isImageAttachment } from "../../_utils/messenger-helpers";

interface FileAttachmentPreviewProps {
  url: string;
  /** If true, shows a remove button — used in the composer before sending */
  onRemove?: () => void;
}

export function FileAttachmentPreview({ url, onRemove }: FileAttachmentPreviewProps) {
  const isImage = isImageAttachment(url);
  const filename = filenameFromUrl(url);

  if (isImage) {
    return (
      <div className="relative inline-block">
        <div className="relative h-36 w-48 overflow-hidden rounded-2xl border border-amber-100 shadow-sm">
          <Image src={url} alt={filename} fill className="object-cover" sizes="192px" />
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white shadow hover:bg-rose-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 shadow-sm">
      <Paperclip className="h-4 w-4 flex-shrink-0 text-slate-500" />
      <span className="max-w-[180px] truncate">{filename}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 flex-shrink-0 text-slate-400 hover:text-rose-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
