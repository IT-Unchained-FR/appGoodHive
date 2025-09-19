"use client";

import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AuthLayout } from "@/app/components/AuthLayout/AuthLayout";
import { Loader } from "@components/loader";
import LabelOption from "@interfaces/label-option";
import { JobForm } from "./JobForm";
import { JobModals } from "./JobModals";

export default function CreateJob() {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<LabelOption | null>(
    null,
  );
  const [selectedChain, setSelectedChain] = useState<LabelOption | null>(null);
  const [typeEngagement, setTypeEngagement] = useState<LabelOption | null>(
    null,
  );
  const [jobType, setJobType] = useState<LabelOption | null>(null);
  const [duration, setDuration] = useState<LabelOption | null>(null);
  const [projectType, setProjectType] = useState<LabelOption | null>(null);
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [jobData, setJobData] = useState<any | null>(null);
  const [budget, setBudget] = useState("");
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [popupModalType, setPopupModalType] = useState("");
  const [isManageFundsModalOpen, setIsManageFundsModalOpen] = useState(false);
  const [jobImage, setJobImage] = useState<string | null>(null);

  const [jobServices, setJobServices] = useState({
    talent: true,
    recruiter: false,
    mentor: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const addFunds = searchParams.get("addFunds");
  const userId = Cookies.get("user_id");

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!userId) {
        console.error("User not logged in");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/companies/my-profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCompanyData(data);
        } else {
          console.error("Failed to fetch company data");
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchJobData = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/companies/job-data?id=${id}`);
          if (response.ok) {
            const data = await response.json();
            setJobData(data);
            // Set form fields from job data
            setDescription(data.description || "");
            setBudget(data.budget || "");
            setSelectedSkills(data.skills ? data.skills.split(", ") : []);
            setJobImage(data.image_url || null);
            // Set other fields...
          }
        } catch (error) {
          console.error("Error fetching job data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCompanyData();
    fetchJobData();
  }, [userId, id]);

  const handleCreateJob = async (jobId: string, amount: string) => {
    // Authentication system being updated for Thirdweb integration
    toast("Job creation will be available after Thirdweb integration.", {
      icon: "🔧",
      duration: 4000,
    });
    return false;
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {id ? "Edit Job" : "Create New Job"}
          </h1>
          
          <JobForm
            description={description}
            setDescription={setDescription}
            selectedSkills={selectedSkills}
            setSelectedSkills={setSelectedSkills}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            typeEngagement={typeEngagement}
            setTypeEngagement={setTypeEngagement}
            jobType={jobType}
            setJobType={setJobType}
            duration={duration}
            setDuration={setDuration}
            projectType={projectType}
            setProjectType={setProjectType}
            companyData={companyData}
            jobData={jobData}
            budget={budget}
            setBudget={setBudget}
            jobImage={jobImage}
            setJobImage={setJobImage}
            jobServices={jobServices}
            setJobServices={setJobServices}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setIsPopupModalOpen={setIsPopupModalOpen}
            setPopupModalType={setPopupModalType}
            handleCreateJob={handleCreateJob}
          />

          <JobModals
            isPopupModalOpen={isPopupModalOpen}
            setIsPopupModalOpen={setIsPopupModalOpen}
            popupModalType={popupModalType}
            isManageFundsModalOpen={isManageFundsModalOpen}
            setIsManageFundsModalOpen={setIsManageFundsModalOpen}
            jobData={jobData}
            selectedCurrency={selectedCurrency}
          />
        </div>
      </div>
    </AuthLayout>
  );
}