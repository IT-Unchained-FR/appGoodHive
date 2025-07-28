import { useState } from "react";
import { toast } from "react-hot-toast";
import { ProfileData } from "../types";

export const useLinkedInImport = () => {
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [isLinkedInImporting, setIsLinkedInImporting] = useState(false);

  const handleLinkedInImport = async (username: string) => {
    try {
      setIsLinkedInImporting(true);

      const response = await fetch(
        `/api/linkedin-import?username=${encodeURIComponent(username)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to import LinkedIn profile",
        );
      }

      const data = await response.json();
      console.log("Bright Data LinkedIn JSON:", data);
    } catch (error) {
      console.error("Error importing LinkedIn profile:", error);
    } finally {
      setIsLinkedInImporting(false);
    }
  };

  const handleLinkedInImportSuccess = async (
    linkedinData: any,
    setProfileData: (updater: (prev: ProfileData) => ProfileData) => void,
    setSelectedSkills: (skills: string[]) => void,
    setSelectedCountry: (country: any) => void,
    countries: any[],
  ) => {
    if (!Array.isArray(linkedinData) || linkedinData.length === 0) {
      toast.error("No LinkedIn data found.");
      return;
    }

    const data = linkedinData[0];
    setIsLinkedInImporting(true);

    try {
      // Send to AI enhancement endpoint
      const aiResponse = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinData: data }),
      });

      let aiData = {
        title: data.position || "",
        description: data.about || "",
        aboutWork: data.about || "",
      };

      if (aiResponse.ok) {
        const aiJson = await aiResponse.json();
        if (aiJson.status === "completed") {
          aiData = aiJson.data;
        }
      }

      // Extract skills using AI
      const skillsResponse = await fetch("/api/ai-extract-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinData: data }),
      });

      let extractedSkills: string[] = [];
      if (skillsResponse.ok) {
        const skillsJson = await skillsResponse.json();
        if (skillsJson.status === "completed" && skillsJson.data.skills) {
          extractedSkills = skillsJson.data.skills;
        }
      }

      // Map experience, education, current company
      setProfileData((prev) => ({
        ...prev,
        first_name:
          data.first_name || data.name?.split(" ")[0] || prev.first_name,
        last_name:
          data.last_name ||
          data.name?.split(" ").slice(1).join(" ") ||
          prev.last_name,
        title: aiData.title || data.position || prev.title,
        description: aiData.description || data.about || prev.description,
        about_work: aiData.aboutWork || data.about || prev.about_work,
        city: data.city || prev.city,
        country: data.country_code || prev.country,
        linkedin: data.url || prev.linkedin,
        image_url: data.avatar || prev.image_url,
        skills:
          extractedSkills.length > 0 ? extractedSkills.join(",") : prev.skills,
        experience: data.experience || prev.experience,
        education: data.education || prev.education,
        current_company: data.current_company || prev.current_company,
      }));

      // Set extracted skills if available
      if (extractedSkills.length > 0) {
        setSelectedSkills(extractedSkills);
      }

      // Optionally set country select
      if (data.country_code) {
        const countryObj = countries.find((c) =>
          c.value.toLowerCase().includes(data.country_code.toLowerCase()),
        );
        if (countryObj) setSelectedCountry(countryObj);
      }

      toast.success("LinkedIn profile imported and polished!");
      setIsLinkedInModalOpen(false);
    } catch (error) {
      console.error("Error enhancing LinkedIn data with AI:", error);
      toast.error("Failed to enhance LinkedIn data with AI");
    } finally {
      setIsLinkedInImporting(false);
    }
  };

  return {
    isLinkedInModalOpen,
    setIsLinkedInModalOpen,
    isLinkedInImporting,
    handleLinkedInImport,
    handleLinkedInImportSuccess,
  };
};
