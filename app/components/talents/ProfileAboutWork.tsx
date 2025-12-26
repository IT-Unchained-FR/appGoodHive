"use client";

import React from "react";
import "@/app/styles/rich-text.css";

interface Props {
  about_work: string;
}

const ProfileAboutWork: React.FC<Props> = ({ about_work }) => {
  const [extendedAboutWork, setExtendedAboutWork] = React.useState(false);

  const maximum_charecter = 1000;
  const plain_text = about_work?.replace(/<[^>]*>/g, "") || "";

  if (plain_text.length > maximum_charecter) {
    if (extendedAboutWork) {
      return (
        <div className="w-full">
          <div
            className="rich-text-content"
            style={{ fontSize: "1rem", lineHeight: "1.7", color: "#374151" }}
            dangerouslySetInnerHTML={{ __html: about_work }}
          />
          <button
            type="button"
            className="mt-4 px-4 py-2 text-sm font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer border border-amber-200"
            onClick={() => setExtendedAboutWork(false)}
          >
            Show Less
          </button>
        </div>
      );
    } else {
      // For truncated view, use a div with the first part of the HTML
      const truncatedHtml = about_work.substring(
        0,
        about_work.indexOf(
          plain_text.substring(maximum_charecter, maximum_charecter + 20),
        ) || maximum_charecter,
      );

      return (
        <div className="w-full">
          <div
            className="rich-text-content"
            style={{ fontSize: "1rem", lineHeight: "1.7", color: "#374151" }}
            dangerouslySetInnerHTML={{ __html: truncatedHtml }}
          />
          <button
            type="button"
            className="mt-4 px-4 py-2 text-sm font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer border border-amber-200"
            onClick={() => setExtendedAboutWork(true)}
          >
            Show More
          </button>
        </div>
      );
    }
  }

  return (
    <div className="w-full">
      <div
        className="rich-text-content"
        style={{ fontSize: "1rem", lineHeight: "1.7", color: "#374151" }}
        dangerouslySetInnerHTML={{ __html: about_work }}
      />
    </div>
  );
};

export default ProfileAboutWork;
