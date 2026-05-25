import { PipelineBoard } from "@/app/components/pipeline/PipelineBoard";

export default function CompanyTalentPipelinePage() {
  return (
    <PipelineBoard
      roleLabel="Company Dashboard"
      findTalentsHref="/companies/dashboard/top-candidates"
      findTalentsLabel="Find Candidates"
    />
  );
}
