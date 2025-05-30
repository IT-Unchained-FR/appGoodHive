"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { BigNumber, ethers } from "ethers";
import {
  useOkto,
  evmRawTransaction,
  getOrdersHistory,
} from "@okto_web3/react-sdk";

import { AuthLayout } from "@/app/components/AuthLayout/AuthLayout";
import { Loader } from "@components/loader";
import { JobForm } from "./JobForm";
import { JobModals } from "./JobModals";
import LabelOption from "@interfaces/label-option";
import { chains } from "@constants/chains";
import { polygonMainnetTokens } from "@constants/token-list/polygon";
import { uuidToUint128 } from "@/lib/blockchain/uint128Conversion";
import { getJobBalance } from "@/app/lib/blockchain/contracts/GoodhiveJobContract";

// Constants
const AMOY_RPC_URL = "https://rpc-amoy.polygon.technology/";
const AMOY_USDC_TOKEN_ADDRESS =
  "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" as `0x${string}`;
const AMOY_CAIP2_ID = "eip155:80002"; // Polygon Amoy
const GOODHIVE_CONTRACT_ADDRESS =
  "0x76Dd1c2dd8F868665BEE369244Ee4590857d1BD3" as `0x${string}`;

// Contract ABIs
const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
];
const goodhiveJobContractAbi = [
  "function createJob(uint128 jobId, uint256 amount, address token) external",
  "function checkBalance(uint128 jobId) external view returns (uint256)",
  "function getJob(uint128 jobId) external view returns (address user, uint256 amount, address token)",
];

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
  const [blockchainBalance, setBlockchainBalance] = useState<number>(0);
  const [jobImage, setJobImage] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [oktoJobId, setOktoJobId] = useState<string | null>(null);
  const [jobServices, setJobServices] = useState({
    talent: true,
    recruiter: false,
    mentor: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const addFunds = searchParams.get("addFunds");
  const walletAddress = Cookies.get("user_address");
  const userId = Cookies.get("user_id");
  const oktoClient = useOkto();

  const handleCreateJob = async (jobId: string, amount: string) => {
    const contractJobIdStr = uuidToUint128(jobId);
    const contractJobId = BigNumber.from(contractJobIdStr); // ✅ no overflow

    if (!oktoClient) {
      toast.error("Okto client not initialized.");
      return false;
    }

    if (!walletAddress) {
      toast.error("Wallet address not found.");
      return false;
    }

    try {
      const parsedAmount = getUsdcSmallestUnit(amount); // USDC has 6 decimals

      console.log({
        parsedAmount,
        contractJobId,
        bigNumber: contractJobId instanceof BigNumber,
        goodhiveContractAddress: GOODHIVE_CONTRACT_ADDRESS,
        usdcTokenAddress: AMOY_USDC_TOKEN_ADDRESS,
        caip2Id: AMOY_CAIP2_ID,
        walletAddress,
      });

      if (!parsedAmount) {
        toast.error(
          "Invalid USDC amount format. Please use a number like 0.1 or 10.",
        );
        return false;
      }

      // --- 1. Approve Transaction ---
      setTransactionStatus("Preparing approval transaction...");
      const erc20Interface = new ethers.utils.Interface(erc20Abi);
      const approveData = erc20Interface.encodeFunctionData("approve", [
        GOODHIVE_CONTRACT_ADDRESS,
        parsedAmount,
      ]) as `0x${string}`;

      console.log("Executing Approve EVM Raw Transaction...");
      const approveTxParams = {
        caip2Id: AMOY_CAIP2_ID,
        transaction: {
          from: walletAddress as `0x${string}`,
          to: AMOY_USDC_TOKEN_ADDRESS,
          value: BigInt(0),
          data: approveData,
        },
      };

      setTransactionStatus("Sending approval transaction to Okto...");
      const approveOktoJobId = await evmRawTransaction(
        oktoClient,
        approveTxParams,
      );
      setOktoJobId(approveOktoJobId);
      console.log("Okto Approve Job ID:", approveOktoJobId);
      setTransactionStatus(
        `Approval transaction sent (Job ID: ${approveOktoJobId}). Waiting for confirmation...`,
      );

      // Wait for approval confirmation
      let approvalConfirmed = false;
      let retries = 0;
      const maxRetries = 100;

      while (!approvalConfirmed && retries < maxRetries) {
        try {
          const orders = await getOrdersHistory(oktoClient, {
            intentId: approveOktoJobId,
            intentType: "RAW_TRANSACTION",
          });

          if (orders?.[0]?.status === "SUCCESSFUL") {
            approvalConfirmed = true;
            break;
          } else if (orders?.[0]?.status === "FAILED") {
            throw new Error(
              `Approval failed: ${orders[0]?.reason || "Unknown reason"}`,
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          retries++;
        } catch (error: any) {
          console.error("Error checking approval status:", error);
          throw new Error(`Failed to confirm approval: ${error.message}`);
        }
      }

      if (!approvalConfirmed) {
        throw new Error("Approval transaction timed out after 100 seconds");
      }

      // --- 2. Create Job Transaction ---
      setTransactionStatus("Preparing createJob transaction...");
      const goodhiveInterface = new ethers.utils.Interface(
        goodhiveJobContractAbi,
      );
      const createJobData = goodhiveInterface.encodeFunctionData("createJob", [
        "100",
        parsedAmount.toString(),
        AMOY_USDC_TOKEN_ADDRESS,
      ]) as `0x${string}`;

      console.log("Executing CreateJob EVM Raw Transaction...");
      const createJobTxParams = {
        caip2Id: AMOY_CAIP2_ID,
        transaction: {
          from: walletAddress as `0x${string}`,
          to: GOODHIVE_CONTRACT_ADDRESS,
          value: BigInt(0),
          data: createJobData,
        },
      };

      setTransactionStatus("Sending createJob transaction to Okto...");
      const createJobOktoJobId = await evmRawTransaction(
        oktoClient,
        createJobTxParams,
      );
      setOktoJobId(createJobOktoJobId);
      console.log("Okto CreateJob Job ID:", createJobOktoJobId);
      setTransactionStatus(
        `CreateJob transaction sent (Job ID: ${createJobOktoJobId}). Your job is being created on-chain!`,
      );

      return true;
    } catch (e: any) {
      console.error("Transaction failed:", e);
      toast.error(`Transaction failed: ${e.message || "Unknown error"}`);
      return false;
    }
  };

  const onPopupModalSubmit = async (amount: number, type: string) => {
    console.log(jobData, "job data");
    const blockId = jobData?.block_id;

    if (!blockId) {
      toast.error("Block ID not found!");
      return;
    }

    if (type === "addFunds" && id) {
      setIsLoading(true);
      try {
        const success = await handleCreateJob(jobData?.id, amount.toString());
        console.log(success, "success");
        // if (success) {
        //   toast.success("Funds added successfully!");
        //   window.location.reload();
        // }
      } catch (error: any) {
        console.error("Error adding funds:", error);
        toast.error(`Failed to add funds: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    handlePopupModalClose();
  };

  const handleCancelJob = async () => {
    toast.loading("Cancelling...", { duration: 2000 });
    const response = await fetch(`/api/companies/delete-job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      toast.success("Job cancelled!");
      router.push(`/companies/my-profile`);
    } else {
      toast.error("Something went wrong!");
      window.location.reload();
    }
  };

  const onManageFundsClick = () => {
    if (selectedChain?.value && selectedCurrency?.value) {
      setIsManageFundsModalOpen(true);
    } else {
      toast.error("Please select chain and currency first!");
    }
  };

  const handlePopupModal = (type: string) => {
    handleManageFundsModalClose();
    setPopupModalType(type);
    setIsPopupModalOpen(true);
  };

  const handleManageFundsModalClose = () => {
    setIsManageFundsModalOpen(false);
  };

  const handlePopupModalClose = () => {
    setIsPopupModalOpen(false);
    setPopupModalType("");
  };

  // Function to convert USDC amount to its smallest unit (6 decimals)
  const getUsdcSmallestUnit = (amount: string): string | null => {
    try {
      // First convert the amount to a number to handle any potential string formatting
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) {
        throw new Error("Invalid amount format");
      }

      // Format the number to exactly 6 decimal places to avoid floating point issues
      const formattedAmount = numericAmount.toFixed(6);

      // Remove the decimal point and convert to string
      const smallestUnit = formattedAmount.replace(".", "");

      // Remove any leading zeros
      const cleanedAmount = smallestUnit.replace(/^0+/, "");

      console.log("Amount conversion:", {
        original: amount,
        numeric: numericAmount,
        formatted: formattedAmount,
        smallest: smallestUnit,
        cleaned: cleanedAmount,
      });

      return cleanedAmount || "0";
    } catch (e) {
      console.error("Invalid USDC amount:", e);
      toast.error(
        "Invalid USDC amount format. Please use a number like 0.1 or 10.",
      );
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    toast.loading("Processing job creation...", { duration: 2000 });

    const formData = new FormData(e.currentTarget);
    const recruiter = formData.get("recruiter") === "on";
    const mentor = formData.get("mentor") === "on";

    const dataForm = {
      userId,
      title: formData.get("title"),
      typeEngagement: typeEngagement ? typeEngagement.value : "",
      description: description,
      duration: duration ? duration?.value : "",
      budget: budget,
      chain: selectedChain ? selectedChain.value : "",
      currency: selectedCurrency ? selectedCurrency.value : "",
      skills: selectedSkills,
      walletAddress: walletAddress ? walletAddress : "",
      city: companyData?.city,
      country: companyData?.country,
      companyName: companyData?.designation,
      imageUrl: jobImage || companyData?.image_url,
      jobType: jobType ? jobType.value : "",
      projectType: projectType ? projectType.value : "",
      talent: true,
      in_saving_stage: false,
      recruiter,
      mentor,
      id,
    };

    try {
      const jobSaveUrl = id
        ? "/api/companies/update-job"
        : "/api/companies/create-job";
      const jobResponse = await fetch(jobSaveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataForm),
      });

      const savedJobData = await jobResponse.json();

      if (!jobResponse.ok) {
        throw new Error("Failed to save job data");
      }

      // If job is saved successfully, proceed with blockchain transaction
      const jobId = id || savedJobData.jobId;
      // Skipping blockchain transaction for now
      if (true) {
        toast.success("Job created successfully!");
        if (id) {
          router.push(`/companies/${userId}`);
        } else {
          router.push(
            `/companies/create-job?id=${savedJobData.jobId}&addFunds=true`,
          );
        }
      } else {
        throw new Error("Failed to complete blockchain transaction");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create job. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    toast.loading("Saving...", { duration: 2000 });

    const dataForm = {
      userId,
      title: document.querySelector<HTMLInputElement>('input[name="title"]')
        ?.value,
      typeEngagement: typeEngagement?.value || "",
      description: description,
      duration: duration?.value || "",
      budget: budget,
      chain: selectedChain?.value || "",
      currency: selectedCurrency?.value || "",
      skills: selectedSkills,
      walletAddress: walletAddress || "",
      city: companyData?.city,
      country: companyData?.country,
      companyName: companyData?.designation,
      imageUrl: jobImage || companyData?.image_url,
      jobType: jobType?.value || "",
      projectType: projectType?.value || "",
      talent: true,
      in_saving_stage: true,
      recruiter:
        document.querySelector<HTMLInputElement>('input[name="recruiter"]')
          ?.checked || false,
      mentor:
        document.querySelector<HTMLInputElement>('input[name="mentor"]')
          ?.checked || false,
      id,
    };

    const jobSaveUrl = id
      ? "/api/companies/update-job"
      : "/api/companies/create-job";

    const jobResponse = await fetch(jobSaveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataForm),
    });

    const savedJobData = await jobResponse.json();

    if (!jobResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      if (id) {
        toast.success("Job Offer Saved!");
        router.push(`/companies/${userId}`);
      } else {
        toast.success("Job Offer Saved! Now add some funds to it.");
        router.push(
          `/companies/create-job?id=${savedJobData.jobId}&addFunds=true`,
        );
      }
    }
  };

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/companies/my-profile?userId=${userId}`,
      );
      const data = await response.json();
      setCompanyData(data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const fetchJobData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/companies/job-data?id=${id}`);
      const data = await response.json();
      setJobData({ ...data, job_id: String(data.job_id) });
      setJobServices({
        talent: true,
        recruiter: data.recruiter === "true" || false,
        mentor: data.mentor === "true" || false,
      });
      setSelectedSkills(data.skills);
      setBudget(data.budget);
      setJobImage(data.image_url);
      setDescription(data.description || "");
      setSelectedChain(
        chains[chains.findIndex((chain) => chain.value === data.chain)] ||
          chains[0],
      );
      setSelectedCurrency(
        polygonMainnetTokens[
          polygonMainnetTokens.findIndex(
            (token) => token.value === data.currency,
          )
        ],
      );
    } catch (error) {
      console.error("Error fetching job data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobBalance = async () => {
    if (!id || !jobData?.id) return;

    try {
      const balance = await getJobBalance(jobData.id);
      setBlockchainBalance(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBlockchainBalance(0);
    }
  };

  useEffect(() => {
    if (!userId) {
      router.push("/auth/login");
    } else {
      fetchCompanyData();
    }
  }, [userId, router]);

  useEffect(() => {
    if (id) {
      fetchJobData();
    }
    if (id && addFunds === "true") {
      handlePopupModal("addFunds");
    }
  }, [id, addFunds]);

  useEffect(() => {
    if (jobData?.id) {
      fetchJobBalance();
    }
  }, [jobData?.id]);

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <AuthLayout>
      <main className="container mx-auto">
        {companyData?.message === "Company not found" && (
          <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
            🚀 Please make a company profile to create a job!
          </p>
        )}
        {!companyData?.approved &&
          companyData?.message !== "Company not found" && (
            <p className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
              🚀 Your company profile is not yet approved, you can't create a
              job!
            </p>
          )}
        <h1 className="my-2 text-2xl border-b-[1px] border-slate-300 ">
          Create Job
        </h1>
        {!!id && jobData && (
          <div className="w-full mb-1 flex justify-end">
            <h3 className="font-bold">
              {isNaN(blockchainBalance) ? (
                <Loader />
              ) : (
                <>
                  Balance: {blockchainBalance}{" "}
                  {selectedCurrency?.label || "USDC"}
                </>
              )}
            </h3>
          </div>
        )}
        <section>
          <JobForm
            isLoading={isLoading}
            companyData={companyData}
            jobData={jobData}
            selectedSkills={selectedSkills}
            setSelectedSkills={setSelectedSkills}
            description={description}
            setDescription={setDescription}
            jobServices={jobServices}
            setJobServices={setJobServices}
            budget={budget}
            setBudget={setBudget}
            jobImage={jobImage}
            setJobImage={setJobImage}
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            typeEngagement={typeEngagement}
            setTypeEngagement={setTypeEngagement}
            jobType={jobType}
            setJobType={setJobType}
            duration={duration}
            setDuration={setDuration}
            projectType={projectType}
            setProjectType={setProjectType}
            blockchainBalance={blockchainBalance}
            onManageFundsClick={onManageFundsClick}
            handleCancelJob={handleCancelJob}
            handleSaveJob={handleSaveJob}
            handleSubmit={handleSubmit}
          />
        </section>

        <JobModals
          isManageFundsModalOpen={isManageFundsModalOpen}
          handleManageFundsModalClose={handleManageFundsModalClose}
          handlePopupModal={handlePopupModal}
          jobData={jobData}
          isPopupModalOpen={isPopupModalOpen}
          handlePopupModalClose={handlePopupModalClose}
          popupModalType={popupModalType}
          onPopupModalSubmit={onPopupModalSubmit}
          selectedCurrency={selectedCurrency}
        />

        {transactionStatus && (
          <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-4 text-center z-50">
            {transactionStatus}
          </div>
        )}
      </main>
    </AuthLayout>
  );
}
