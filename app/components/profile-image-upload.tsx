import React, { useState, useRef, useCallback, memo } from "react";
import Image from "next/image";
import { uploadFileToBucket } from "@/app/utils/upload-file-bucket";
import Modal from "./modal";
import { toast } from "react-hot-toast";

const VALID_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function BeePlaceholder({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="beeBodyGradient" x1="28" y1="30" x2="68" y2="66">
          <stop offset="0%" stopColor="#ffd560" />
          <stop offset="100%" stopColor="#f2a81d" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="52" rx="22" ry="17" fill="url(#beeBodyGradient)" />
      <ellipse cx="49" cy="36" rx="12" ry="9" fill="#f8fafc" fillOpacity="0.9" />
      <ellipse cx="67" cy="33" rx="12" ry="9" fill="#f8fafc" fillOpacity="0.78" />
      <path
        d="M44 46C52 47 68 47 76 46"
        stroke="#1f2937"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M40 55C50 56 69 56 79 55"
        stroke="#1f2937"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="38" cy="50" r="5.5" fill="#1f2937" />
      <path
        d="M33 44C29 37 24 32 18 28"
        stroke="#1f2937"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M78 49L84 52L78 55"
        fill="#1f2937"
      />
      <circle cx="34" cy="49" r="1.5" fill="#fff" fillOpacity="0.75" />
    </svg>
  );
}

interface ProfileImageUploadProps {
  currentImage?: string | null;
  displayName?: string;
  onImageUpdate: (imageUrl: string) => void;
  onClose?: () => void;
  variant?: "profile" | "job";
  size?: number;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  displayName = "",
  onImageUpdate,
  onClose,
  variant = "profile",
  size = 120,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 10; // 10MB

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!VALID_IMAGE_TYPES.includes(file.type)) {
        toast.error("Invalid file type. Please upload a JPEG or PNG file.");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [],
  );

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    fileInputRef.current?.click();
  }, []);

  const handleClose = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (onClose) onClose();
    },
    [onClose],
  );

  const handleSubmit = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!selectedFile) return;

      setIsLoading(true);
      try {
        const imageUrl = await uploadFileToBucket(selectedFile);
        if (imageUrl) {
          onImageUpdate(imageUrl as string);
          toast.success(
            `${variant === "profile" ? "Profile" : "Job"} image updated successfully!`,
          );
          handleClose();
        }
      } catch (error) {
        toast.error("Failed to upload image");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [handleClose, onImageUpdate, selectedFile, variant],
  );

  const openModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  }, []);

  const modalTitle =
    variant === "profile" ? "Edit Profile Image" : "Edit Job Image";
  const modalSubtitle =
    variant === "profile"
      ? "Update your profile picture"
      : "Update your job listing image";

  const hexagonSize = size * 1.1; // Slightly larger to accommodate the hexagon shape
  const boxShadow =
    "0 4px 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08)";
  const hexagonClipPath =
    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
  const isCompactEmptyState = size <= 120;
  const activeImage = previewUrl || currentImage || "";
  const renderEmptyHexagon = (compact: boolean) => (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        clipPath: hexagonClipPath,
        boxShadow,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.98) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-[8%] opacity-95"
        style={{
          clipPath: hexagonClipPath,
          background:
            "radial-gradient(circle at 50% 14%, rgba(251,191,36,0.18), transparent 30%), linear-gradient(180deg, rgba(255,251,235,0.72), rgba(255,255,255,0.34))",
        }}
      />
      <svg
        className="pointer-events-none absolute inset-[7%] z-[1] h-[86%] w-[86%]"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <polygon
          points="50,3 94,26 94,74 50,97 6,74 6,26"
          stroke="rgba(148, 163, 184, 0.42)"
          strokeWidth="1.8"
          strokeDasharray={compact ? "4 6" : "5 7"}
          strokeLinecap="round"
          fill="rgba(255,255,255,0.28)"
        />
      </svg>
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 z-[2] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center ${
          compact ? "w-[70%]" : "w-[72%]"
        }`}
      >
        <div className={`relative ${compact ? "mb-1 h-7 w-7" : "mb-3 h-14 w-14"}`}>
          <Image
            src="/icons/profile-bee.svg"
            alt="GoodHive bee profile placeholder"
            fill
            className="object-contain"
          />
        </div>
        {compact ? (
          <div className="text-center">
            <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-amber-700/90">
              Profile photo
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-700/90">
              Profile photo
            </p>
            <p className="mt-3 text-[10px] leading-4 text-slate-500">
              Tap to choose a JPG or PNG.
            </p>
          </div>
        )}
      </div>
      <div
        className={`pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 rounded-full bg-amber-200/40 blur-2xl ${
          compact ? "bottom-6 h-8 w-16" : "bottom-12 h-8 w-20"
        }`}
      />
    </div>
  );

  return (
    <>
      <div onClick={openModal} className="cursor-pointer relative">
        {currentImage ? (
          <div
            className="relative"
            style={{
              width: `${hexagonSize}px`,
              height: `${hexagonSize}px`,
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center shadow-2xl"
              style={{
                clipPath: hexagonClipPath,
                backgroundColor: "#F0F0F0",
                overflow: "hidden",
              }}
            >
              <Image
                src={currentImage}
                alt={variant === "profile" ? "Profile" : "Job Image"}
                fill
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
            <div className="absolute bottom-1 right-1 rounded-full bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] p-1.5 text-white shadow-[0_10px_18px_rgba(249,115,22,0.24)] z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
          </div>
        ) : (
          <div
            className="relative"
            style={{
              width: `${hexagonSize}px`,
              height: `${hexagonSize}px`,
            }}
          >
            {renderEmptyHexagon(isCompactEmptyState)}
            <div className="absolute bottom-1 right-1 rounded-full bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] p-1.5 text-white shadow-[0_10px_18px_rgba(249,115,22,0.24)] z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* File input outside of modal to prevent reload issues */}
      <input
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileChange}
        ref={fileInputRef}
        aria-label="Profile picture file input"
        title="Upload a profile picture"
      />

      {isOpen && (
        <Modal open={isOpen} onClose={handleClose}>
          <div
            className="w-full min-w-[320px] max-w-[760px] bg-white"
            style={{ width: "760px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-7 pb-5 pt-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-slate-950">
                    Upload profile photo
                  </h2>
                  <div className="mt-5 inline-flex border-b-2 border-[#f3b61f] pb-2 text-sm font-semibold text-[#f3b61f]">
                    Upload
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-7 py-6">
              <div
                className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-6 sm:p-8"
                onClick={handleButtonClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative mb-5 h-[156px] w-[156px]">
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        clipPath: hexagonClipPath,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.98))",
                        boxShadow:
                          "0 18px 34px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(226,232,240,0.9)",
                      }}
                    >
                      {activeImage ? (
                        <Image
                          src={activeImage}
                          alt={variant === "profile" ? "Profile" : "Job Image"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BeePlaceholder className="h-16 w-16 drop-shadow-[0_8px_16px_rgba(15,23,42,0.12)]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-slate-700"
                    >
                      <path d="M12 3v12"></path>
                      <path d="m7 8 5-5 5 5"></path>
                      <path d="M5 21h14"></path>
                    </svg>
                  </div>

                  <p className="text-[1.15rem] font-semibold text-slate-900">
                    Drop your image here to upload
                  </p>
                  <p className="mt-2 max-w-[430px] text-sm leading-6 text-slate-500">
                    Works with JPG or PNG files. Recommended size 300 x 300.
                  </p>

                  <button
                    type="button"
                    onClick={handleButtonClick}
                    className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[linear-gradient(135deg,_#f8cf4c,_#f3b61f)] px-7 text-sm font-semibold text-slate-950 shadow-[0_12px_24px_rgba(243,182,31,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(243,182,31,0.3)]"
                    aria-label="Choose file"
                  >
                    Choose File
                  </button>

                  {selectedFile ? (
                    <p className="mt-4 text-sm font-medium text-slate-700">
                      Selected: {selectedFile.name}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  You can keep the default bee avatar until you upload a photo.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    aria-label="Cancel changes"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !selectedFile}
                    className={`inline-flex min-h-[48px] items-center justify-center rounded-full px-5 text-sm font-semibold text-slate-950 transition ${
                      isLoading || !selectedFile
                        ? "cursor-not-allowed bg-amber-200/80 opacity-70"
                        : "bg-[#FFC905] hover:bg-[#f5bc00]"
                    }`}
                    aria-label="Save profile changes"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default memo(ProfileImageUpload);
