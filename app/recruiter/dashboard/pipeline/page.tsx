import { PipelineBoard } from "@/app/components/pipeline/PipelineBoard";

export default function RecruiterTalentPipelinePage() {
  return (
    <PipelineBoard
      roleLabel="Recruiter Dashboard"
      findTalentsHref="/recruiter/dashboard/find-talents"
      findTalentsLabel="Find Talents"
    />
  );
}
