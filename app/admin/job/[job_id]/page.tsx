"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { Spinner } from "@/app/components/admin/Spinner";
import { IJobOffer } from "@/interfaces/job-offer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  jobTypes,
  projectDuration,
  projectTypes,
  typeEngagements,
} from "@/app/constants/common";
import { chains } from "@/app/constants/chains";
import { Textarea } from "@/components/ui/textarea";

// Currency options from tokens.json
const currencyOptions = [
  { value: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", label: "USDC" },
  { value: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", label: "DAI" },
  { value: "0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4", label: "AUGUR" },
  { value: "0x4d0B6356605e6FA95c025a6f6092ECcf0Cf4317b", label: "EURO" },
];

export default function AdminEditJobPage() {
  const params = useParams();
  const router = useRouter();
  const job_id = params.job_id as string;

  const [job, setJob] = useState<IJobOffer | null>(null);
  const [initialJob, setInitialJob] = useState<IJobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const breadcrumbLabels =
    job || initialJob
      ? {
          [job_id]: job?.title || initialJob?.title || "Job Detail",
        }
      : undefined;

  useEffect(() => {
    if (job_id) {
      fetch(`/api/admin/job/${job_id}`)
        .then(async (res) => {
          if (res.status === 401) {
            router.push("/admin/login");
            return null;
          }

          return res.json();
        })
        .then((data) => {
          if (!data) {
            return;
          }
          setJob(data);
          setInitialJob(data);
          setReviewFeedback(data.admin_feedback || "");
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to fetch job details.");
          setLoading(false);
        });
    }
  }, [job_id, router]);

  const hasChanges = useMemo(() => {
    if (!job || !initialJob) return false;
    return JSON.stringify(job) !== JSON.stringify(initialJob);
  }, [job, initialJob]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!job) return;
    const { name, value } = e.target;
    setJob({ ...job, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (!job) return;
    setJob({ ...job, [name]: value });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (!job) return;
    setJob({ ...job, [name]: checked });
  };

  const handleSave = async () => {
    if (!job) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/job/${job_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (response.ok) {
        const updatedJob = await response.json();
        setJob(updatedJob);
        setInitialJob(updatedJob);
        toast.success("Job updated successfully!");
      } else {
        toast.error("Failed to update job.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReview = async (action: "approve" | "reject") => {
    setIsReviewing(true);
    try {
      const response = await fetch(`/api/admin/jobs/${job_id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          feedback: reviewFeedback,
        }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to review job");
      }

      const nextReviewStatus =
        action === "approve" ? "approved" : "rejected";
      setJob((current) =>
        current
          ? {
              ...current,
              published: action === "approve",
              review_status: nextReviewStatus,
              admin_feedback: data.data?.admin_feedback ?? reviewFeedback,
            }
          : current,
      );
      setInitialJob((current) =>
        current
          ? {
              ...current,
              published: action === "approve",
              review_status: nextReviewStatus,
              admin_feedback: data.data?.admin_feedback ?? reviewFeedback,
            }
          : current,
      );
      toast.success(
        action === "approve" ? "Job approved successfully" : "Job rejected successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to review job",
      );
    } finally {
      setIsReviewing(false);
    }
  };

  if (loading) {
    return (
      <AdminPageLayout title="Edit Job" breadcrumbLabels={breadcrumbLabels}>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AdminPageLayout>
    );
  }

  if (!job) {
    return (
      <AdminPageLayout title="Edit Job" breadcrumbLabels={breadcrumbLabels}>
        <div className="text-center py-12">Job not found.</div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={`Edit Job: ${initialJob?.title}`}
      subtitle={`ID: ${job.id}`}
      breadcrumbLabels={breadcrumbLabels}
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Job Details Section */}
        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <h3 className="mb-6 text-xl font-semibold">Job Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                name="title"
                value={job.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={job.company_name}
                disabled
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={job.description}
                onChange={handleInputChange}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type_engagement">Type of Engagement</Label>
              <Select
                name="type_engagement"
                value={job.type_engagement}
                onValueChange={(value) =>
                  handleSelectChange("type_engagement", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select engagement type" />
                </SelectTrigger>
                <SelectContent>
                  {typeEngagements.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_type">Job Type</Label>
              <Select
                name="job_type"
                value={job.job_type}
                onValueChange={(value) => handleSelectChange("job_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_type">Project Type</Label>
              <Select
                name="project_type"
                value={job.project_type}
                onValueChange={(value) =>
                  handleSelectChange("project_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select
                name="duration"
                value={job.duration}
                onValueChange={(value) => handleSelectChange("duration", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {projectDuration.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Technical Details Section */}
        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <h3 className="mb-6 text-xl font-semibold">Technical Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                name="skills"
                value={job.skills}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Budget & Chain Section */}
        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <h3 className="mb-6 text-xl font-semibold">Budget & Blockchain</h3>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                value={job.budget}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                name="currency"
                value={job.currency}
                onValueChange={(value) => handleSelectChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chain">Blockchain</Label>
              <Select
                name="chain"
                value={job.chain}
                onValueChange={(value) => handleSelectChange("chain", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <h3 className="mb-6 text-xl font-semibold">Status</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review_status">Review Status</Label>
              <Input
                id="review_status"
                value={job.review_status || (job.published ? "approved" : "draft")}
                disabled
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
              <Label htmlFor="published" className="flex-grow">
                Published
              </Label>
              <Switch
                id="published"
                name="published"
                checked={job.published}
                onCheckedChange={(checked) =>
                  handleSwitchChange("published", checked)
                }
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
              <Label htmlFor="in_saving_stage" className="flex-grow">
                In Saving Stage
              </Label>
              <Switch
                id="in_saving_stage"
                name="in_saving_stage"
                checked={job.in_saving_stage}
                onCheckedChange={(checked) =>
                  handleSwitchChange("in_saving_stage", checked)
                }
              />
            </div>
            <div className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded-md">
              <p>
                <strong>Status Rules:</strong>
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  If "In Saving Stage" is turned OFF and "Published" is ON, the
                  job will be visible on the site
                </li>
                <li>
                  If "Published" is ON but "In Saving Stage" is also ON, the job
                  will NOT show on the site
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <h3 className="mb-6 text-xl font-semibold">Admin Review</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin_feedback">Feedback</Label>
              <Textarea
                id="admin_feedback"
                value={reviewFeedback}
                onChange={(event) => setReviewFeedback(event.target.value)}
                rows={5}
                placeholder="Add optional feedback for the company..."
              />
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => handleReview("approve")}
                disabled={isReviewing}
                size="lg"
                className="w-full sm:w-auto"
              >
                Approve Job
              </Button>
              <Button
                type="button"
                onClick={() => handleReview("reject")}
                disabled={isReviewing}
                size="lg"
                variant="destructive"
                className="w-full sm:w-auto"
              >
                Reject Job
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  );
}
