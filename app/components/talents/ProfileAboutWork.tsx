"use client";

import React from "react";
import "@/app/styles/rich-text.css";

interface Props {
  about_work: string;
}

const ProfileAboutWork: React.FC<Props> = ({ about_work }) => {
  const [extendedAboutWork, setExtendedAboutWork] = React.useState(false);

  const maximum_charecter = 500;
  const plain_text = about_work?.replace(/<[^>]*>/g, "") || "";

  if (plain_text.length > maximum_charecter) {
    if (extendedAboutWork) {
      return (
        <div className="w-full h-full mb-10 text-ellipsis overflow-hidden">
          <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">About Work:</h3>
          <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: about_work }}
          />
          <span
            className="text-[#FFC905] text-decoration-none cursor-pointer"
            onClick={() => setExtendedAboutWork(false)}
          >
            ...Show Less
          </span>
        </div>
      );
    } else {
      // For truncated view, use a div with the first part of the HTML
      // This is a simplistic approach - a better solution might parse the HTML properly
      const truncatedHtml = about_work.substring(
        0,
        about_work.indexOf(
          plain_text.substring(maximum_charecter, maximum_charecter + 20),
        ) || maximum_charecter,
      );

      return (
        <div className="w-full h-full mb-10 text-ellipsis overflow-hidden">
          <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">About Work:</h3>

          <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: truncatedHtml }}
          />
          <span
            className="text-[#FFC905] text-decoration-none cursor-pointer"
            onClick={() => setExtendedAboutWork(true)}
          >
            ...Show More
          </span>
        </div>
      );
    }
  }

  return (
    <div className="w-full h-full mb-10 text-ellipsis overflow-hidden">
      <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">About Work:</h3>

      <div
        className="rich-text-content"
        dangerouslySetInnerHTML={{ __html: about_work }}
      />
    </div>
  );
};

export default ProfileAboutWork;
