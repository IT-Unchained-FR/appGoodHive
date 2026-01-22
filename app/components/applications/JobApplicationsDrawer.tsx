"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Users, Briefcase } from "lucide-react";
import { IJobApplicationWithDetails } from "@/interfaces/job-application";
import { ApplicationsList } from "./ApplicationsList";
import { ApplicationDetailPanel } from "./ApplicationDetailPanel";

interface JobApplicationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyUserId: string;
  applicationCount: number;
  onApplicationCountChange?: (newCount: number) => void;
}

export function JobApplicationsDrawer({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyUserId,
  applicationCount,
  onApplicationCountChange,
}: JobApplicationsDrawerProps) {
  const [applications, setApplications] = useState<IJobApplicationWithDetails[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<IJobApplicationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && jobId) {
      fetchApplications();
    }
  }, [isOpen, jobId]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/applications/${jobId}?companyUserId=${companyUserId}`
      );
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectApplication = (application: IJobApplicationWithDetails) => {
    setSelectedApplication(application);
  };

  const handleUpdateApplication = (updatedApplication: IJobApplicationWithDetails) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === updatedApplication.id ? updatedApplication : app
      )
    );
    setSelectedApplication(updatedApplication);
  };

  const handleCloseDetail = () => {
    setSelectedApplication(null);
  };

  if (!mounted || !isOpen) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {jobTitle}
              </h2>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {applications.length} application{applications.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Applications List */}
          <div
            className={`${
              selectedApplication ? "w-1/2 border-r border-gray-200" : "w-full"
            } overflow-y-auto p-4 transition-all`}
          >
            <ApplicationsList
              applications={applications}
              onSelectApplication={handleSelectApplication}
              selectedApplicationId={selectedApplication?.id}
              isLoading={isLoading}
            />
          </div>

          {/* Detail Panel */}
          {selectedApplication && (
            <div className="w-1/2 overflow-hidden">
              <ApplicationDetailPanel
                application={selectedApplication}
                jobId={jobId}
                companyUserId={companyUserId}
                onUpdate={handleUpdateApplication}
                onClose={handleCloseDetail}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
