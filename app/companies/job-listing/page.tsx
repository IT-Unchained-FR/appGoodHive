"use client";

import { useRef, useState, FormEvent } from "react";

import toast from "react-hot-toast";

import { Button } from "../../components/button";

interface FileData {
  name: string;
  type: string;
  data: string | ArrayBuffer | null;
}

export default function JobListing() {
  const invoiceInputValue = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<false | FileData>(false);
  const [isRenderedPage, setIsRenderedPage] = useState<boolean>(true);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const dataForm = {
      title: formData.get("title"),
      typeEngagement: formData.get("type-engagement"),
      description: formData.get("description"),
      duration: formData.get("duration"),
      ratePerHour: formData.get("rate-per-hour"),
      budget: formData.get("budget"),
      skills: formData.get("skills"),
    };
  };

  //Todo: get formData jobs; get formData Companies
  return (
    <main className="mx-5">
      <div className="bg-[#FFC905] h-20"></div>
      <section>
        <div className="flex flex-row">
          <div className="flex flex-col w-2/6 mr-2">
            <div className="flex flex-col bg-white p-5 rounded-lg -mt-10">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold">Company name</h2>
                <p className="text-sm">Company picture</p>
                <p className="text-sm">Company profile</p>
              </div>
            </div>

            <div className="flex flex-col bg-white p-5 mt-8 rounded-lg">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold">Contact info</h2>
                <p className="text-sm">Email</p>
                <p className="text-sm">Phone</p>
                <p className="text-sm">Address</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-4/6 bg-white p-5 -mt-10 rounded-lg ml-2">
            <h1 className="text-2xl font-bold mb-8">Job listing</h1>
            <div className="flex flex-col gap-4">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                eget nisl vitae augue ullamcorper congue. Donec iaculis elit in
                eros tristique, vitae bibendum neque pulvinar.
              </p>
              <p>
                Sed et consectetur felis. Integer fermentum enim velit, sit amet
                blandit ipsum porttitor eget. Suspendisse volutpat orci a sapien
                hendrerit, eu ullamcorper dolor congue.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
