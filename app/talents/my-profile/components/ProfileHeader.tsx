import "@/app/styles/rich-text.css";
import dynamic from "next/dynamic";
import { ProfileData } from "../types";

// Dynamically import React Quill to prevent server-side rendering issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Define Quill modules and formats
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

interface ProfileHeaderProps {
  profileData: ProfileData;
  errors: { [key: string]: string };
  onInputChange: (name: string, value: any) => void;
}

// Utility function to decode base64 HTML wrapped in p tags
function decodeBase64HtmlWrappedInPTags(str: string) {
  if (!str) return "";
  const match = str.match(/^<p>([A-Za-z0-9+/=\s]+)<\/p>$/);
  if (match) {
    try {
      const base64 = match[1].replace(/\s/g, "");
      const decoded = atob(base64);
      if (/<[a-z][\s\S]*>/i.test(decoded)) {
        return decoded;
      }
      return base64;
    } catch (e) {
      return str;
    }
  }
  return str;
}

export const ProfileHeader = ({
  profileData,
  errors,
  onInputChange,
}: ProfileHeaderProps) => {
  return (
    <div className="flex flex-col w-full mt-10">
      <div>
        <label
          htmlFor="title"
          className="inline-block ml-3 text-base text-black form-label mb-2"
        >
          Profile header *
        </label>
      </div>
      <input
        className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
        placeholder="Title"
        type="text"
        maxLength={100}
        value={profileData?.title || ""}
        onChange={(e) => onInputChange("title", e.target.value)}
      />
      {errors.title && (
        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
      )}

      {/* Description */}
      <div className="mt-5 ml-0">
        <label
          htmlFor="description"
          className="inline-block ml-3 text-base text-black form-label mb-2"
        >
          Description *
        </label>
        <div style={{ borderRadius: "16px", overflow: "hidden" }}>
          <ReactQuill
            theme="snow"
            modules={quillModules}
            className="quill-editor"
            value={decodeBase64HtmlWrappedInPTags(
              profileData?.description || "",
            )}
            onChange={(content) => onInputChange("description", content)}
            placeholder="Describe your skills and experience in a few words*"
            style={{
              fontSize: "1rem",
              height: "260px", // Increased by 30% from 200px
              marginBottom: "40px",
            }}
          />
        </div>
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
        <p
          className="text-[13px] mt-16 text-right w-full"
          style={{ color: "#FFC905" }}
        >
          {profileData.description?.replace(/<[^>]*>/g, "")?.length || 0}/10000
        </p>
      </div>
    </div>
  );
};
