"use client";

import React from "react";

interface Props {
  about_work: string;
}

const ProfileAboutWork: React.FC<Props> = ({ about_work }) => {
  const [extendedAboutWork, setExtendedAboutWork] = React.useState(false);

  const maximum_charecter = 500;

  if (about_work.length > maximum_charecter) {
    if (extendedAboutWork) {
      return (
        <p className="w-full h-full mb-10 text-ellipsis overflow-hidden">
          {about_work}
          <span
            className="text-[#FFC905] text-decoration-none cursor-pointer"
            onClick={() => setExtendedAboutWork(false)}
          >
            ...Show Less
          </span>
        </p>
      );
    } else {
      return (
        <p className="w-full h-full mb-10 text-ellipsis overflow-hidden">
          {about_work.slice(0, maximum_charecter)}
          <span
            className="text-[#FFC905] text-decoration-none cursor-pointer"
            onClick={() => setExtendedAboutWork(true)}
          >
            ...Show More
          </span>
        </p>
      );
    }
  }

  return (
    <p className="w-full h-full mb-10 text-ellipsis overflow-hidden">
      {about_work}
    </p>
  );
};

export default ProfileAboutWork;
