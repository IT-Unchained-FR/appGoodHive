import ProfileImageUpload from "@/app/components/profile-image-upload";
import "@/app/styles/rich-text.css";
import { calculateJobCreateFees } from "@/app/utils/calculate-job-create-fees";
import { AutoSuggestInput } from "@components/autosuggest-input";
import { SelectInput } from "@components/select-input";
import { ToggleButton } from "@components/toggle-button";
import { chains } from "@constants/chains";
import {
  createJobServices,
  jobTypes,
  projectDuration,
  projectTypes,
  typeEngagements,
} from "@constants/common";
import { skills } from "@constants/skills";
import {
  ethereumTokens,
  gnosisChainTokens,
} from "@constants/token-list/index.js";
import { polygonMainnetTokens } from "@constants/token-list/polygon";
import LabelOption from "@interfaces/label-option";
import { Tooltip } from "@nextui-org/tooltip";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "react-hot-toast";
import "react-quill/dist/quill.snow.css";

// Dynamically import React Quill to prevent server-side rendering issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Define Quill modules and formats
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

interface JobFormProps {
  isLoading: boolean;
  published: boolean;
  companyData: any;
  jobData: any;
  selectedSkills: string[];
  setSelectedSkills: (skills: string[]) => void;
  description: string;
  setDescription: (description: string) => void;
  jobServices: {
    talent: boolean;
    recruiter: boolean;
    mentor: boolean;
  };
  setJobServices: (services: any) => void;
  budget: string;
  setBudget: (budget: string) => void;
  jobImage: string | null;
  setJobImage: (image: string) => void;
  selectedChain: LabelOption | null;
  setSelectedChain: (chain: LabelOption | null) => void;
  selectedCurrency: LabelOption | null;
  setSelectedCurrency: (currency: LabelOption | null) => void;
  typeEngagement: LabelOption | null;
  setTypeEngagement: (engagement: LabelOption | null) => void;
  jobType: LabelOption | null;
  setJobType: (type: LabelOption | null) => void;
  duration: LabelOption | null;
  setDuration: (duration: LabelOption | null) => void;
  projectType: LabelOption | null;
  setProjectType: (type: LabelOption | null) => void;
  blockchainBalance: number;
  onManageFundsClick: () => void;
  handleCancelJob: () => void;
  handleSaveJob: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const JobForm = ({
  isLoading,
  companyData,
  jobData,
  selectedSkills,
  setSelectedSkills,
  description,
  setDescription,
  jobServices,
  setJobServices,
  budget,
  setBudget,
  jobImage,
  setJobImage,
  selectedChain,
  setSelectedChain,
  selectedCurrency,
  setSelectedCurrency,
  typeEngagement,
  setTypeEngagement,
  jobType,
  setJobType,
  duration,
  setDuration,
  projectType,
  setProjectType,
  blockchainBalance,
  onManageFundsClick,
  handleCancelJob,
  handleSaveJob,
}: JobFormProps) => {
  const [isCommissionExpanded, setIsCommissionExpanded] = useState(false);

  // Calculate total percentage of selected services
  const getTotalPercentage = () => {
    let total = 0;
    if (jobServices.talent) total += 10;
    if (jobServices.recruiter) total += 8;
    if (jobServices.mentor) total += 12;
    return total;
  };

  const onJobServicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedServices = {
      ...jobServices,
      [event.target.name]: event.target.checked,
    };
    setJobServices(updatedServices);
  };

  const onBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(event.target.value);
  };

  const handleUnpublishJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/companies/manage-job`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: jobData?.id,
          publish: false,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Job unpublished successfully");
        window.location.reload();
      } else {
        throw new Error(data.message || "Failed to unpublish job");
      }
    } catch (error: any) {
      console.error("Error unpublishing job:", error);
      toast.error(error.message || "Failed to unpublish job");
    }
  };

  const handlePublishJob = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/companies/manage-job`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: jobData?.id,
          publish: true,
          in_saving_stage: false,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Job published successfully");
        window.location.reload();
      } else {
        throw new Error(data.message || "Failed to publish job");
      }
    } catch (error: any) {
      console.error("Error publishing job:", error);
      toast.error(error.message || "Failed to publish job");
    }
  };

  return (
    <form>
      <div className="flex flex-col w-full">
        <div className="flex flex-col gap-4">
          <div className="mt-4 flex justify-center">
            <div className="flex flex-col gap-2 items-center">
              <ProfileImageUpload
                currentImage={jobImage || companyData?.image_url || ""}
                displayName="Job Image"
                onImageUpdate={(imageUrl) => setJobImage(imageUrl)}
                variant="job"
                size={160}
              />
              <p className="text-sm text-gray-500">
                This image will be displayed on the job page.
              </p>
            </div>
          </div>
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
          <div className="w-full flex gap-5 justify-between sm:flex-col">
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
                  (type) => type.value === jobData?.typeEngagement,
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
                jobTypes.findIndex((type) => type.value === jobData?.jobType)
                ]
              }
            />
          </div>
        </div>
        <div className="flex flex-col w-full mt-4">
          <label
            htmlFor="description"
            className="inline-block ml-3 mb-1 text-base text-black form-label"
          >
            Job Description*
          </label>
          <ReactQuill
            theme="snow"
            modules={quillModules}
            value={description}
            onChange={setDescription}
            placeholder="Describe the job requirements and responsibilities..."
            className="quill-editor"
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
                            selectedSkills.filter((_, i) => i !== index),
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

        <div className="w-1/2 sm:w-full mb-5 px-3 flex justify-between sm:flex-wrap sm:gap-5">
          {createJobServices.map((service) => {
            const { label, value, tooltip } = service;
            const isChecked = jobServices[value as keyof typeof jobServices];
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

        <div className="flex gap-4 mt-4 sm:flex-col">
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
                  (type) => type.value === jobData?.duration,
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
                  (type) => type.value === jobData?.projectType,
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
                title="Enter budget amount"
                placeholder="Enter amount"
              />
            </div>
          ) : null}
        </div>

        {/* GoodHive Commission Section */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsCommissionExpanded(!isCommissionExpanded)}
          >
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-800">GoodHive Commission Breakdown</h3>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-sm font-bold text-yellow-600">{getTotalPercentage()}%</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="text-xl font-bold text-yellow-600">
                  {budget && Number(budget) > 0 ? (
                    selectedCurrency?.label ?
                      `${calculateJobCreateFees(projectType, budget, jobServices)} ${selectedCurrency.label}` :
                      `${calculateJobCreateFees(projectType, budget, jobServices)} ${jobData?.currency || 'USDC'}`
                  ) : (
                    "Enter budget to see fees"
                  )}
                </p>
              </div>
              <div className={`transform transition-transform duration-200 ${isCommissionExpanded ? 'rotate-180' : ''}`}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {isCommissionExpanded && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {jobServices.talent && (
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Talent Selection</span>
                      <span className="text-sm font-bold text-green-600">10%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Self-selection fee</p>
                    {budget && Number(budget) > 0 && (
                      <p className="text-sm font-semibold mt-1">
                        {(Number(budget) * 0.1).toFixed(2)} {selectedCurrency?.label || jobData?.currency || 'USDC'}
                      </p>
                    )}
                  </div>
                )}

                {jobServices.recruiter && (
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Recruiter Service</span>
                      <span className="text-sm font-bold text-blue-600">8%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Talent curation fee</p>
                    {budget && Number(budget) > 0 && (
                      <p className="text-sm font-semibold mt-1">
                        {(Number(budget) * 0.08).toFixed(2)} {selectedCurrency?.label || jobData?.currency || 'USDC'}
                      </p>
                    )}
                  </div>
                )}

                {jobServices.mentor && (
                  <div className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Mentor Service</span>
                      <span className="text-sm font-bold text-purple-600">12%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Technical mentoring fee</p>
                    {budget && Number(budget) > 0 && (
                      <p className="text-sm font-semibold mt-1">
                        {(Number(budget) * 0.12).toFixed(2)} {selectedCurrency?.label || jobData?.currency || 'USDC'}
                      </p>
                    )}
                  </div>
                )}

                {!jobServices.talent && !jobServices.recruiter && !jobServices.mentor && (
                  <div className="col-span-full text-center py-4">
                    <p className="text-gray-500">Select at least one service above to see commission breakdown</p>
                  </div>
                )}
              </div>

              {budget && Number(budget) > 0 && (jobServices.talent || jobServices.recruiter || jobServices.mentor) && (
                <div className="mt-3 p-2 bg-gray-100 rounded text-center">
                  <p className="text-xs text-gray-600">
                    Total Project Cost: <span className="font-semibold">
                      {(Number(budget) + Number(calculateJobCreateFees(projectType, budget, jobServices) || 0)).toFixed(2)} {selectedCurrency?.label || jobData?.currency || 'USDC'}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-4 sm:flex-col">
          <div className="flex-1">
            <SelectInput
              labelText="Chain"
              name="chain"
              required={true}
              disabled={true}
              inputValue={selectedChain}
              setInputValue={setSelectedChain}
              options={chains}
              defaultValue={
                chains[
                chains.findIndex((type) => type.value === jobData?.chain)
                ] || chains[0]
              }
            />
          </div>
          <div className="flex-1">
            <SelectInput
              labelText="Currency"
              name="currency"
              required={true}
              disabled={!selectedChain}
              inputValue={selectedCurrency}
              setInputValue={setSelectedCurrency}
              options={
                selectedChain?.value === "ethereum"
                  ? ethereumTokens
                  : selectedChain?.value === "polygon"
                    ? polygonMainnetTokens
                    : selectedChain?.value === "gnosis-chain"
                      ? gnosisChainTokens
                      : []
              }
              defaultValue={
                polygonMainnetTokens[
                polygonMainnetTokens.findIndex(
                  (token) => token.value === jobData?.currency,
                )
                ]
              }
            />
          </div>
        </div>

        <div className="mt-12 mb-8 w-full flex justify-end gap-4 text-right">
          {!!jobData?.job_id && (
            <Tooltip content="Provisioning funds boost swift community response to your job offer.">
              <button
                className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
                type="button"
                onClick={onManageFundsClick}
              // disabled={isLoading || !companyData?.approved}
              >
                Manage Funds
              </button>
            </Tooltip>
          )}
          {!!jobData?.job_id && (
            <button
              className="my-2 text-base font-semibold bg-transparent border-2 border-[#FFC905] h-14 w-56 rounded-full transition duration-150 ease-in-out"
              type="button"
              onClick={handleCancelJob}
              disabled={isLoading || !companyData?.approved}
            >
              Cancel Job
            </button>
          )}

          {isLoading ? (
            <button
              className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full opacity-50 cursor-not-allowed transition duration-150 ease-in-out"
              type="submit"
              disabled
            >
              Saving...
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleSaveJob}
                className="my-2 text-base font-semibold bg-transparent h-14 w-56 rounded-full border-2 border-[#FFC905] transition-all duration-300 hover:bg-[#FFC905]"
                disabled={isLoading || !companyData?.approved}
              >
                Save Job
              </button>

              {!jobData?.published && (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full transition-all duration-300 hover:bg-transparent hover:border-2 hover:border-[#FFC905]"
                  type="button"
                  onClick={handlePublishJob}
                  disabled={isLoading || !companyData?.approved}
                >
                  Publish Job
                </button>
              )}
              {jobData?.published && (
                <button
                  className="my-2 text-base font-semibold bg-[#FFC905] h-14 w-56 rounded-full transition-all duration-300 hover:bg-transparent hover:border-2 hover:border-[#FFC905]"
                  type="button"
                  onClick={handleUnpublishJob}
                  disabled={isLoading || !companyData?.approved}
                >
                  Unpublish Job
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
