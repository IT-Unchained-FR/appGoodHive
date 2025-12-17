"use client";

import { IJobSection } from "@/interfaces/job-offer";
import { ChevronDownIcon, ChevronUpIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useConnectModal } from "thirdweb/react";
import { connectModalOptions } from "@/lib/auth/walletConfig";

interface JobSectionDisplayProps {
  section: IJobSection;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const JobSectionDisplay: React.FC<JobSectionDisplayProps> = ({
  section,
  isExpanded = true,
  onToggle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);
  const { isAuthenticated } = useAuth();
  const { connect } = useConnectModal();

  const expanded = onToggle ? isExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));

  const handleConnectWallet = () => {
    if (connect) {
      connect(connectModalOptions);
    }
  };

  return (
    <div className="border border-yellow-200 rounded-xl mb-6 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-yellow-400">
      {/* Section Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#fef5cf] transition-all duration-300 border-b border-yellow-100"
        onClick={handleToggle}
      >
        <h3 className="text-xl font-semibold text-gray-900 flex-1 leading-tight">
          {section.heading}
        </h3>
        <div className="ml-4 p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 transition-colors">
          {expanded ? (
            <ChevronUpIcon className="w-5 h-5 text-yellow-700" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-yellow-700" />
          )}
        </div>
      </div>

      {/* Section Content */}
      {expanded && (
        <div className="px-6 pb-6 pt-4 bg-[#fef5cf]/30">
          {isAuthenticated ? (
            <div
              className="prose prose-lg max-w-none text-gray-700 job-section-content leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="mb-6 p-4 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100">
                <LockClosedIcon className="w-12 h-12 text-amber-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Content Locked
              </h4>
              <p className="text-gray-600 mb-6 max-w-md">
                Connect your wallet to view the full job description and unlock all details about this position.
              </p>
              <button
                onClick={handleConnectWallet}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-lg shadow-md hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <LockClosedIcon className="w-5 h-5" />
                Connect Wallet to View
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface JobSectionsDisplayProps {
  sections: IJobSection[];
  defaultExpanded?: boolean;
  className?: string;
}

export const JobSectionsDisplay: React.FC<JobSectionsDisplayProps> = ({
  sections,
  defaultExpanded = false,
  className = "",
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    defaultExpanded
      ? new Set(sections.map((_, index) => index))
      : new Set([0]) // Expand first section by default
  );

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map((_, index) => index)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  if (!sections || sections.length === 0) {
    return (
      <div className={`text-gray-500 text-center py-8 ${className}`}>
        <p>No job description sections available.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Control buttons - only show if there are multiple sections */}
      {sections.length > 1 && (
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={expandAll}
            className="text-sm font-medium text-yellow-600 hover:text-yellow-800 hover:bg-[#fef5cf] transition-all duration-200 px-3 py-2 rounded-lg border border-yellow-200 hover:border-yellow-400"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-sm font-medium text-yellow-600 hover:text-yellow-800 hover:bg-[#fef5cf] transition-all duration-200 px-3 py-2 rounded-lg border border-yellow-200 hover:border-yellow-400"
          >
            Collapse All
          </button>
        </div>
      )}

      {/* Job Sections */}
      <div className="space-y-4">
        {sections
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((section, index) => (
            <JobSectionDisplay
              key={section.id || index}
              section={section}
              isExpanded={expandedSections.has(index)}
              onToggle={() => toggleSection(index)}
            />
          ))}
      </div>
    </div>
  );
};

export default JobSectionsDisplay;