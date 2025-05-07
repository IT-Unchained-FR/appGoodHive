"use client";

import React from "react";
import {
  Play,
  User,
  Briefcase,
  Search,
  FileText,
  Users,
  Building2,
  ClipboardList,
} from "lucide-react";
import { ProfileType } from "./ProfileTypeSelector";
import Image from "next/image";

interface VideoTutorialsProps {
  profileType: ProfileType;
  onVideoSelect: (index: number) => void;
}

const VideoTutorials: React.FC<VideoTutorialsProps> = ({
  profileType,
  onVideoSelect,
}) => {
  const tutorials = {
    talent: [
      {
        title: "Creating Your Talent Profile",
        description:
          "Learn how to create an engaging talent profile that stands out",
        duration: "3:45",
        thumbnail:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=480&h=320&fit=crop",
      },
      {
        title: "Showcasing Your Skills",
        description: "Effectively highlight your skills and experience",
        duration: "4:20",
        thumbnail:
          "https://images.unsplash.com/photo-1552664730-d307ca884978?w=480&h=320&fit=crop",
      },
      {
        title: "Finding Opportunities",
        description: "Discover and apply for relevant opportunities",
        duration: "3:15",
        thumbnail:
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=480&h=320&fit=crop",
      },
    ],
    company: [
      {
        title: "Setting Up Your Company Profile",
        description: "Create a professional company profile to attract talent",
        duration: "4:10",
        thumbnail:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=480&h=320&fit=crop",
      },
      {
        title: "Posting Job Opportunities",
        description: "Learn how to create and manage job postings",
        duration: "3:55",
        thumbnail:
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=480&h=320&fit=crop",
      },
      {
        title: "Managing Applications",
        description: "Effectively review and manage talent applications",
        duration: "3:30",
        thumbnail:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=480&h=320&fit=crop",
      },
    ],
  };

  return (
    <div className="space-y-4">
      {tutorials[profileType].map((tutorial, index) => (
        <button
          key={index}
          onClick={() => onVideoSelect(index)}
          className="w-full border border-gray-200 rounded-lg hover:border-[#FFC905] transition-colors text-left overflow-hidden"
        >
          <div className="flex">
            <div className="relative w-48 h-32 flex-shrink-0">
              <Image
                src={tutorial.thumbnail}
                alt={tutorial.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 192px"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-[#FFC905]" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                {tutorial.duration}
              </div>
            </div>
            <div className="flex-grow p-4">
              <h3 className="font-semibold text-gray-800">{tutorial.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {tutorial.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default VideoTutorials;
