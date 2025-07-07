import Image from "next/image";

import { Card } from "@/app/components/card";
import { CompanyContactBtn } from "@/app/components/companies/company-contact-btn";
import { getCompanyData } from "@/lib/fetch-company-data";
import { getCompanyJobs, getSingleJob } from "@/lib/fetch-company-jobs";
import { JobCard } from "@components/job-card";
import { CompanySocialMediaAndContact } from "@/app/components/companies/profile-social-media-and-contact";
import { CompanyBio } from "@/app/components/companies/company-bio-section";
import { generateCountryFlag } from "@/app/utils/generate-country-flag";
import { join } from "path";

export const revalidate = 0;

type CompanyProfilePageProps = {
  params: {
    userId: string;
  };
  searchParams: {
    id?: number;
  };
};

export default async function CompanyProfilePage(
  context: CompanyProfilePageProps,
) {
  const { userId } = context.params;
  const { id: jobId } = context.searchParams;
  console.log(jobId, "jobId...goodhive");
  let profileData: any = {};
  try {
    profileData = await getCompanyData(userId);
  } catch (error) {
    console.error("Failed to fetch company data:", error);
    profileData = {};
  }
  const jobs = await getCompanyJobs(userId);
  const singleJob = await getSingleJob(jobId as unknown as number);

  const {
    headline,
    designation,
    address: streetAddress,
    country,
    city,
    phone_country_code,
    phone_number,
    email,
    telegram,
    linkedin,
    twitter,
    github,
    stackoverflow,
    portfolio,
    image_url,
    user_id,
  } = profileData;

  return (
    <main className="relative pt-16">
      <div className="bg-yellow-400 absolute w-full top-0 left-0 h-28 z-1"></div>
      <div className="container mx-auto flex mb-20 md:flex-col sm:flex-col md:gap-5 sm:gap-5">
        <div className="w-2/6 md:w-full sm:w-full mr-5 flex flex-col z-2">
          <div className="relative bg-white rounded-2xl flex flex-col items-center p-5 shadow-[2px_7px_20px_4px_#e2e8f0]">
            <div className="flex flex-col items-center justify-center w-full mt-5 mb-5">
              <div
                className="relative h-[180px] w-[180px] flex items-center justify-center cursor-pointer bg-gray-100"
                style={{
                  clipPath:
                    "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)",
                }}
              >
                <Image
                  className="object-cover"
                  src={image_url || "/img/placeholder-image.png"}
                  alt="profile-picture"
                  fill
                />
              </div>
            </div>
            <h1 className="text-[#4E4E4E] text-3xl font-bold mb-3">
              {designation}
            </h1>
            <h4 className="text-[#4E4E4E] text-base mb-4">
              {city}, {country}
            </h4>

            <div className="flex w-full justify-center gap-5 mb-12">
              <CompanyContactBtn toEmail={email} toUserName={designation} />
            </div>
            <div className="flex flex-col w-full px-5 justify-start">
              <h3 className="text-[#4E4E4E] text-lg font-bold mb-5">Bio:</h3>
              {/* <p className="w-full mb-10 text-ellipsis overflow-hidden">
                {headline}
              </p> */}
              <CompanyBio text={headline} />
              <div className="flex flex-col mb-10">
                <CompanySocialMediaAndContact
                  twitter={twitter}
                  linkedin={linkedin}
                  telegram={telegram}
                  github={github}
                  stackoverflow={stackoverflow}
                  portfolio={portfolio}
                  email={email}
                  phone_country_code={phone_country_code}
                  phone_number={phone_number}
                  streetAddress={streetAddress}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="w-4/6 md:w-full sm:w-full bg-white relative rounded-2xl flex flex-col items-center p-5 shadow-[2px_7px_20px_4px_#e2e8f0] z-2">
          {userId && singleJob && (
            <div className="w-full flex flex-col mb-5">
              <h2 className="text-left w-full pl-5 mb-2 mt-5 text-2xl font-bold">
                Job Details:
              </h2>
              <div className="flex flex-col min-w-full gap-3 ">
                <JobCard
                  key={singleJob.id}
                  id={singleJob.id}
                  type="Job"
                  title={singleJob.title}
                  postedBy={singleJob.companyName}
                  details={singleJob.description}
                  duration={singleJob.duration}
                  image={singleJob.image_url || "/img/company_img.png"}
                  countryFlag={generateCountryFlag(singleJob.country) as string}
                  city={singleJob.city}
                  country={singleJob.country}
                  typeEngagement={singleJob.typeEngagement}
                  jobType={singleJob.jobType}
                  projectType={singleJob.projectType}
                  budget={singleJob.budget}
                  skills={singleJob.skills}
                  buttonText="Connect"
                  walletAddress={singleJob.walletAddress}
                  companyEmail={email}
                  escrowAmount={singleJob.escrowAmount}
                  user_id={singleJob.user_id}
                />
              </div>
            </div>
          )}
          <h2 className="text-left w-full pl-5 mb-2 mt-5 text-2xl font-bold">
            Job listings:
          </h2>
          <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-1 md:grid-cols-1 sm:grid-cols-1 ">
            {jobs.map((job) => {
              if (job.id === singleJob?.id) return null;
              const {
                id,
                title,
                companyName,
                description,
                city,
                budget,
                projectType,
                skills,
                image_url,
                walletAddress,
                country,
                escrowAmount,
                postedAt,
              } = job;
              const getRelativeTime = (postedAt: string) => {
                const now = new Date();
                const posted = new Date(postedAt);
                const diffMs = now.getTime() - posted.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                const diffMonths = Math.floor(diffDays / 30);
                const diffYears = Math.floor(diffDays / 365);

                if (diffYears > 0)
                  return `Posted ${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
                if (diffMonths > 0)
                  return `Posted ${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
                if (diffDays > 0)
                  return `Posted ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
                if (diffHours > 0)
                  return `Posted ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
                if (diffMins > 0)
                  return `Posted ${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
                return "Posted just now";
              };

              return (
                <Card
                  uniqueId={userId}
                  mentor={job.mentor === "true"}
                  recruiter={job.recruiter === "true"}
                  key={id}
                  jobId={id}
                  type="company"
                  title={title}
                  postedBy={companyName}
                  postedOn={getRelativeTime(postedAt)}
                  image={image_url || "/img/company_img.png"}
                  country={country}
                  city={city}
                  budget={budget}
                  projectType={projectType}
                  currency="USD"
                  description={description}
                  skills={skills}
                  buttonText="Apply"
                  walletAddress={walletAddress}
                  escrowAmount={escrowAmount}
                />
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
