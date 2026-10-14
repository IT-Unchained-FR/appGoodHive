"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadFileToBucket } from "@/app/utils/upload-file-bucket";

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  shape?: "cover" | "avatar";
}

export default function ImageField({ label, value, onChange, shape = "cover" }: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = (await uploadFileToBucket(file)) as string | null;
      if (url) onChange(url);
    } finally {
      setUploading(false);
    }
  };

  const preview =
    shape === "avatar" ? "h-16 w-16 rounded-full" : "aspect-[16/9] w-full rounded-lg";

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <div className={`relative overflow-hidden border border-dashed border-gray-300 bg-gray-50 ${preview}`}>
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-gray-700 shadow hover:bg-white"
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {shape === "cover" && (uploading ? "Uploading…" : "Upload image")}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
}
