"use client";

import { useRef, useState } from "react";

import DragAndDropFile from "../../components/drag-and-drop-file";

export default function MyProfile() {
  const invoiceInputValue = useRef(null);

  const [file, setFile] = useState(null);
  const [isRenderedPage, setIsRenderedPage] = useState(true);

  return (
    <main className="mx-5">
      <h1 className="my-5 text-xl font-bold border-gray-300 border-b-[1px] sm:text-2xl pb-2">
        My Profile
      </h1>
      <section>
        <div className="flex flex-col items-center justify-center w-full">
          <DragAndDropFile
            file={file}
            setFile={setFile}
            isRenderedPage={isRenderedPage}
            setIsRenderedPage={setIsRenderedPage}
            invoiceInputValue={invoiceInputValue}
          />
        </div>
      </section>
    </main>
  );
}
