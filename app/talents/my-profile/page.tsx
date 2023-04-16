"use client";

import { useRef, useState } from "react";

import DragAndDropFile from "../../components/drag-and-drop-file";
import { NavBar } from "../../components/nav-bar";
import { Rainbowkit } from "../../components/rainbowkit";

interface FileData {
  name: string;
  type: string;
  data: string | ArrayBuffer | null;
}

export default function MyProfile() {
  const invoiceInputValue = useRef(null);

  const [file, setFile] = useState<false | FileData>(false);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);

  return (
    <main className="mx-5">
      <h1 className="my-5 text-2xl">My Profile</h1>
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
