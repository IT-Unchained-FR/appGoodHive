"use client";

import { useRef, useState } from "react";

import DragAndDropFile from "../../components/drag-and-drop-file";
import { NavBar } from "../../components/nav-bar";
import { Rainbowkit } from "../../components/rainbowkit";

export default function MyProfile() {
  const invoiceInputValue = useRef(null);

  const [file, setFile] = useState(null);
  const [isRenderedPage, setIsRenderedPage] = useState(true);

  return (
    <Rainbowkit>
      <NavBar />
      <main className="mx-5">
        <h1 className="my-5 text-2xl">My Profile</h1>
      </main>
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
    </Rainbowkit>
  );
}
