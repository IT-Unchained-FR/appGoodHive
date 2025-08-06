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

interface AboutWorkProps {
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

export const AboutWork = ({
  profileData,
  errors,
  onInputChange,
}: AboutWorkProps) => {
  return (
    <div className="mt-4">
      <label
        htmlFor="about_work"
        className="inline-block ml-3 text-base text-black form-label mb-2"
      >
        About your Work*
      </label>
      <div style={{ borderRadius: "9999px", overflow: "hidden" }}>
        <ReactQuill
          theme="snow"
          modules={quillModules}
          className="quill-editor"
          value={decodeBase64HtmlWrappedInPTags(profileData?.about_work || "")}
          onChange={(content) => onInputChange("about_work", content)}
          placeholder="What you are looking for?"
          style={{
            fontSize: "1rem",
            height: "260px", // Increased by 30% from 200px
            marginBottom: "40px",
          }}
        />
      </div>
      {errors.about_work && (
        <p className="text-red-500 text-sm mt-1">{errors.about_work}</p>
      )}
      <p
        className="text-[13px] mt-16 text-right w-full"
        style={{ color: "#FFC905" }}
      >
        {profileData.about_work?.replace(/<[^>]*>/g, "")?.length || 0}/10000
      </p>
    </div>
  );
};
