"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
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

export default function AdminEditJobPage() {
  const params = useParams();
  const job_id = params.job_id as string;

  const [job, setJob] = useState<IJobOffer | null>(null);
  const [initialJob, setInitialJob] = useState<IJobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (job_id) {
      fetch(`/api/admin/job/${job_id}`)
        .then((res) => res.json())
        .then((data) => {
          setJob(data);
          setInitialJob(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to fetch job details.");
          setLoading(false);
        });
    }
  }, [job_id]);

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

  if (loading) {
    return (
      <AdminPageLayout title="Edit Job">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AdminPageLayout>
    );
  }

  if (!job) {
    return (
      <AdminPageLayout title="Edit Job">
        <div className="text-center py-12">Job not found.</div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={`Edit Job: ${initialJob?.title}`}
      subtitle={`ID: ${job.id}`}
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Job Details Section */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-6">Job Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {typeEngagements.map((option: any) => (
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
                  {jobTypes.map((option: any) => (
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
                  {projectTypes.map((option: any) => (
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
                  {projectDuration.map((option: any) => (
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
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-6">Technical Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-6">Budget & Blockchain</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Input
                id="currency"
                name="currency"
                value={job.currency}
                onChange={handleInputChange}
              />
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
                  {chains.map((option: any) => (
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
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-6">Status</h3>
          <div className="flex items-center space-x-4">
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
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="lg"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  );
}
