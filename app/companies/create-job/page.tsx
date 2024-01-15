"use client";

import { useState, FormEvent, useContext, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

import { SelectInput } from "@components/select-input";
import { SearchSelectInput } from "@components/search-select-input";
import { AddressContext } from "@components/context";
import { skills } from "@/app/constants/skills";
import {
  ethereumTokens,
  polygonTokens,
  gnosisChainTokens,
} from "@/app/constants/token-list/index.js";
import { chains } from "@/app/constants/chains";
import LabelOption from "@interfaces/label-option";
import { Loader } from "@components/loader";
import {
  createJobServices,
  jobTypes,
  projectDuration,
  projectTypes,
  typeEngagements,
} from "@constants/common";
import { AutoSuggestInput } from "@components/autosuggest-input";
import { ToggleButton } from "@/app/components/toggle-button";
import { calculateJobCreateFees } from "@/app/utils/calculate-job-create-fees";
import { Button } from "@/app/components/button";
import Modal from "@/app/components/modal";
import { useCreateJob } from "@/app/hooks/CreateJob";

export default function CreateJob() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<LabelOption | null>(
    null
  );
  const [selectedChain, setSelectedChain] = useState<LabelOption | null>(null);
  const [typeEngagement, setTypeEngagement] = useState<LabelOption | null>(
    null
  );
  const [jobType, setJobType] = useState<LabelOption | null>(null);
  const [duration, setDuration] = useState<LabelOption | null>(null);
  const [projectType, setProjectType] = useState<LabelOption | null>(null);
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [jobData, setJobData] = useState<any | null>(null);
  const [budget, setBudget] = useState("");
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [popupModalType, setPopupModalType] = useState("");
  const [provisionAmount, setProvisionAmount] = useState(0);
  const [partialAmountSelected, setPartialAmountSelected] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  const [jobServices, setJobServices] = useState({
    talent: true,
    recruiter: false,
    mentor: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const walletAddress = useContext(AddressContext);

  const { createJobTx, withdrawFundsTx, checkBalanceTx } = useCreateJob({
    walletAddress,
  });

  const handlePopupModal = (type: string) => {
    setPopupModalType(type);
    setIsPopupModalOpen(true);
  };

  const onProvisionFundsClick = () => {
    handlePopupModal("provision-funds");
    console.log("provision funds");
  };

  const handleProvisionFunds = () => {
    if (Number(provisionAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    console.log("provision funds", Number(provisionAmount));
    createJobTx(Number(id), Number(provisionAmount));
  };

  const handleWithdrawFunds = () => {
    if (withdrawAmount < 1) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (jobData.escrow_amount && !partialAmountSelected) {
      console.log("full amount", Number(jobData.escrow_amount));
    }
    console.log("withdraw funds", withdrawAmount);
  };

  const handleCheckBalance = async () => {
    const balance = await checkBalanceTx(Number(id));
    if (balance) {
      toast.success(`Balance: ${balance} ETH`);
    }
  };

  const handlePopupModalClose = () => {
    setIsPopupModalOpen(false);
    setPopupModalType("");
  };

  const handleProvisionAmountChange = (e: any) => {
    setProvisionAmount(e.target.value);
  };

  const handleWithdrawAmountChange = (e: any) => {
    setWithdrawAmount(e.target.value);
  };

  const onBudgetChange = (e: any) => {
    setBudget(e.target.value);
  };

  const totalFees = calculateJobCreateFees(projectType, budget, jobServices);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    console.log("submitting...");
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const recruiter = formData.get("recruiter") === "on";
    const mentor = formData.get("mentor") === "on";

    const dataForm = {
      title: formData.get("title"),
      typeEngagement: typeEngagement ? typeEngagement.value : "",
      description: formData.get("description"),
      duration: duration ? duration?.value : "",
      ratePerHour: "",
      budget: Number(budget),
      chain: selectedChain ? selectedChain.value : "",
      currency: selectedCurrency ? selectedCurrency.value : "",
      skills: selectedSkills,
      walletAddress,
      city: companyData?.city,
      country: companyData?.country,
      companyName: companyData?.designation,
      imageUrl: companyData?.image_url,
      jobType: jobType ? jobType.value : "",
      projectType: projectType ? projectType.value : "",
      talent: true,
      recruiter,
      mentor,
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

    setIsLoading(false);

    if (!jobResponse.ok) {
      toast.error("Something went wrong!");
    } else {
      toast.success("Job Offer Saved!");
      router.push(`/companies/${walletAddress}`);
    }
  };

  const onJobServicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setJobServices({
      ...jobServices,
      [event.target.name]: event.target.checked,
    });
  };

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/companies/my-profile?walletAddress=${walletAddress}`
      );
      const data = await response.json();
      setCompanyData(data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
    }
  };

  const fetchJobData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/companies/job-data?id=${id}`);
      const data = await response.json();
      console.log("job data >>", data);
      setJobData(data);
      setJobServices({
        talent: true,
        recruiter: data.recruiter === "true" || false,
        mentor: data.mentor === "true" || false,
      });
      setSelectedSkills(data.skills);
      setBudget(data.budget);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchCompanyData();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (id) {
      fetchJobData();
    }
  }, [id]);

  if (!walletAddress) {
    return (
      <h3 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 To get started, please connect your wallet. This will enable you to
        create your company profile and create jobs.
      </h3>
    );
  }

  if (walletAddress && companyData && !companyData?.designation) {
    return (
      <h3 className="px-4 py-3 text-xl font-medium text-center text-red-500 rounded-md shadow-md bg-yellow-50">
        🚀 Complete your company profile first before creating a job.
      </h3>
    );
  }

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <main className="container mx-auto">
      <h1 className="my-5 text-2xl border-b-[1px] border-slate-300 ">
        Create Job
      </h1>
      <section>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col w-full mt-4">
            <div className="flex flex-col gap-4 mt-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="title"
                  className="inline-block ml-3 text-base text-black form-label"
                >
                  Job Header*
                </label>
                <input
                  className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                  placeholder="Job Header..."
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                  defaultValue={jobData?.title}
                />
              </div>
              <div className="w-full flex gap-5 justify-between">
                <SelectInput
                  labelText="Type of engagement"
                  name="type-engagement"
                  required={true}
                  disabled={false}
                  inputValue={typeEngagement}
                  setInputValue={setTypeEngagement}
                  options={typeEngagements}
                  defaultValue={
                    typeEngagements[
                      typeEngagements.findIndex(
                        (type) => type.value === jobData?.typeEngagement
                      )
                    ]
                  }
                />

                <SelectInput
                  labelText="Job Type"
                  name="job-type"
                  required={true}
                  disabled={false}
                  inputValue={jobType}
                  setInputValue={setJobType}
                  options={jobTypes}
                  defaultValue={
                    jobTypes[
                      jobTypes.findIndex(
                        (type) => type.value === jobData?.jobType
                      )
                    ]
                  }
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="inline-block mt-4 ml-3 text-base text-black form-label"
              ></label>
            </div>
            <div>
              <textarea
                name="description"
                className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                placeholder="Project Description"
                maxLength={255}
                rows={5}
                defaultValue={jobData?.description}
              />
            </div>
            <div className="relative flex flex-col gap-4 mt-12 mb-10 sm:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="skills"
                  className="inline-block ml-3 text-base font-bold text-black form-label"
                >
                  Mandatory Skills*
                </label>
                <div className="absolute w-full pt-1 pr-10 text-base font-normal text-gray-600 bg-white form-control ">
                  <AutoSuggestInput
                    inputs={skills}
                    selectedInputs={selectedSkills}
                    setSelectedInputs={setSelectedSkills}
                  />
                </div>
                <div className="pt-10">
                  {!!selectedSkills && selectedSkills.length > 0 && (
                    <div className="flex flex-wrap mt-4 ">
                      {selectedSkills.map((skill, index) => (
                        <div
                          key={index}
                          className="border border-[#FFC905] flex items-center bg-gray-200 rounded-full py-1 px-3 m-1"
                        >
                          <span className="mr-2">{skill}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSkills(
                                selectedSkills.filter((_, i) => i !== index)
                              );
                            }}
                            className="w-6 text-black bg-gray-400 rounded-full"
                          >
                            &#10005;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add three checkbox here which are Talent, Recruiter and Mentor and aslo match up the styles we are having here. And add a i circular button in the right side of every checkbox lebel and if hover over it should show text just like tooltip */}
            <div className="w-1/2 sm:w-full mb-5 px-3 flex justify-between">
              {createJobServices.map((service) => {
                const { label, value, tooltip } = service;
                const isChecked =
                  jobData?.[value] === "true" || value === "talent" || false;
                const isTalent = value === "talent";
                return (
                  <ToggleButton
                    key={value}
                    label={label}
                    name={value}
                    checked={isChecked}
                    tooltip={tooltip}
                    onChange={onJobServicesChange}
                    disabled={isTalent}
                  />
                );
              })}
            </div>

            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <SelectInput
                  labelText="Project Duration"
                  name="duration"
                  required={true}
                  disabled={false}
                  inputValue={duration}
                  setInputValue={setDuration}
                  options={projectDuration}
                  defaultValue={
                    projectDuration[
                      projectDuration.findIndex(
                        (type) => type.value === jobData?.duration
                      )
                    ]
                  }
                />
              </div>

              <div className="flex-1">
                <SelectInput
                  labelText="Project Type"
                  name="projectType"
                  required={true}
                  disabled={false}
                  inputValue={projectType}
                  setInputValue={setProjectType}
                  options={projectTypes}
                  defaultValue={
                    projectTypes[
                      projectTypes.findIndex(
                        (type) => type.value === jobData?.projectType
                      )
                    ]
                  }
                />
              </div>
              {projectType || jobData?.projectType ? (
                <div className="flex-1">
                  <label
                    htmlFor="budget"
                    className="inline-block ml-3 text-base text-black form-label"
                  >
                    {projectType && projectType.value === "fixed"
                      ? "Budget*"
                      : "Expected Hourly Rate*"}
                  </label>
                  <input
                    className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                    type="number"
                    name="budget"
                    onChange={onBudgetChange}
                    required
                    value={budget}
                    maxLength={100}
                    defaultValue={jobData?.budget}
                  />
                </div>
              ) : null}
            </div>
            {jobData?.budget || budget ? (
              <p className="mt-2 text-right">
                {projectType && projectType.value === "hourly"
                  ? "Total fees per hour:"
                  : "Total fees:"}{" "}
                {totalFees} USD
              </p>
            ) : null}
            <div className="flex gap-4 mt-3"></div>
            {/* <div className="flex flex-col gap-4 mt-4 sm:flex-row">
              <div className="flex sm:w-1/4">
                <SelectInput
                  labelText="Chain"
                  name="chain"
                  required={false}
                  disabled={false}
                  inputValue={selectedChain}
                  setInputValue={setSelectedChain}
                  options={chains}
                  defaultValue={
                    chains[
                      chains.findIndex((type) => type.value === jobData?.chain)
                    ]
                  }
                />
              </div>
              <div className="flex sm:w-3/4">
                <SearchSelectInput
                  labelText="Currency"
                  name="currency"
                  required={false}
                  disabled={!selectedChain}
                  inputValue={selectedCurrency}
                  setInputValue={setSelectedCurrency}
                  options={
                    selectedChain?.value === "ethereum"
                      ? ethereumTokens
                      : selectedChain?.value === "polygon"
                      ? polygonTokens
                      : selectedChain?.value === "gnosis-chain"
                      ? gnosisChainTokens
                      : []
                  }
                />
              </div>
            </div> */}

            <div className="mt-10 w-full flex justify-end gap-4 text-right">
              <button
                className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
                type="button"
                onClick={handleCheckBalance}
              >
                Check Balance
              </button>
              <button
                className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
                type="button"
                onClick={onProvisionFundsClick}
              >
                Provision the funds
              </button>
              {isLoading ? (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
                  type="submit"
                  disabled
                >
                  Saving...
                </button>
              ) : (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                  type="submit"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </form>
      </section>
      <Modal open={isPopupModalOpen} onClose={handlePopupModalClose}>
        {popupModalType === "provision-funds" ? (
          <div className="relative bg-white w-full h-full rounded shadow-lg border-0 p-0">
            <div className="flex flex-col items-center justify-center p-5">
              <div className="flex justify-between w-full">
                <h3 className="text-2xl font-semibold text-black">
                  Provision the funds
                </h3>
                <button
                  type="button"
                  onClick={handlePopupModalClose}
                  className="w-6 text-black bg-gray-400 rounded-full"
                >
                  &#10005;
                </button>
              </div>
              <div className="flex flex-col items-center justify-center mt-5">
                <p className="text-base font-normal text-gray-600">
                  Please put some provision funds to create a job offer. You
                  will be charged gas fee on top of your budget.
                </p>
                <div className="flex flex-col items-center justify-center mt-5">
                  {/* Input field for provision amount */}
                  <input
                    className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-full hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
                    type="number"
                    name="provisionAmount"
                    required
                    maxLength={100}
                    placeholder="Enter the amount"
                    onChange={handleProvisionAmountChange}
                  />
                  <button
                    className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                    type="submit"
                    onClick={handleProvisionFunds}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : popupModalType === "withdraw-funds" ? (
          <div className="relative bg-white w-full h-full rounded shadow-lg border-0 p-0">
            <div className="flex flex-col items-center justify-center p-5">
              <div className="flex justify-between w-full">
                <h3 className="text-2xl font-semibold text-black">
                  Withdraw the funds
                </h3>
                <button
                  type="button"
                  onClick={handlePopupModalClose}
                  className="w-6 text-black bg-gray-400 rounded-full"
                >
                  &#10005;
                </button>
              </div>
              <div className="flex flex-col items-center justify-center mt-5">
                <div className="flex flex-col items-center justify-center mt-5">
                  {/* Will be 2 checkbox one is Full amount another partial amount if partial amount is selected then there will be a input field for amount */}

                  <div>
                    <input
                      type="checkbox"
                      id="fullAmount"
                      name="amount"
                      value="Full"
                    />
                    <label htmlFor="fullAmount">Full Amount</label>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="partialAmount"
                      name="amount"
                      value="Partial"
                      onClick={() =>
                        setPartialAmountSelected(!partialAmountSelected)
                      }
                    />
                    <label htmlFor="partialAmount">Partial Amount</label>
                  </div>
                  {partialAmountSelected && (
                    <div>
                      <label htmlFor="amount">Amount:</label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        onChange={handleWithdrawAmountChange}
                      />
                    </div>
                  )}

                  <button
                    className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full hover:bg-opacity-80 active:shadow-md transition duration-150 ease-in-out"
                    type="submit"
                    onClick={handleWithdrawFunds}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </main>
  );
}
