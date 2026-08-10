"use client";

import { Job } from "@/types";
import { useJobActions } from "@/lib/jobs/useJobActions";
import JobDetailPanel from "./JobDetailPanel";

interface JobDetailsClientProps {
  initialJob: Job;
}

export default function JobDetailsClient({
  initialJob,
}: JobDetailsClientProps) {
  const {
    job,
    isUpdating,
    updateStatus,
    viewResume,
    viewCoverLetter,
    generateResume,
    generateCoverLetter,
  } = useJobActions(initialJob);

  return (
    <div className="bg-earth-50 border border-earth-200 shadow-sm rounded-lg overflow-hidden h-[calc(100vh-9rem)]">
      <JobDetailPanel
        job={job}
        isUpdating={isUpdating}
        onUpdateStatus={updateStatus}
        onViewResume={viewResume}
        onGenerateResume={generateResume}
        onViewCoverLetter={viewCoverLetter}
        onGenerateCoverLetter={generateCoverLetter}
      />
    </div>
  );
}
