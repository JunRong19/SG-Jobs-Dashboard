import { Job } from "@/types";
import { AlertTriangle } from "lucide-react";
import { PipelineStatus } from "@/lib/jobs/pipelineStatus";
import JobDetailHeader from "./JobDetailHeader";
import JobActionButtons from "./JobActionButtons";
import MarkdownRenderer from "./MarkdownRenderer";

interface JobDetailPanelProps {
  job: Job;
  isUpdating: boolean;
  onUpdateStatus: (value: PipelineStatus | null) => void;
  onViewResume: (jobId: string, resumeId: string | null | undefined) => void;
  onGenerateResume: () => void;
  onViewCoverLetter: (
    jobId: string,
    coverLetterId: string | null | undefined
  ) => void;
  onGenerateCoverLetter: () => void;
}

export default function JobDetailPanel({
  job,
  isUpdating,
  onUpdateStatus,
  onViewResume,
  onGenerateResume,
  onViewCoverLetter,
  onGenerateCoverLetter,
}: JobDetailPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Scrollable header + description; keyed so the entrance replays only
          when the selected job actually changes, not on status updates */}
      <div
        key={job.job_id}
        className="flex-1 overflow-y-auto p-6 animate-panel-in"
      >
        <JobDetailHeader job={job} />

        <div className="mt-6">
          {job.description ? (
            <div className="prose max-w-none prose-headings:text-earth-900 prose-p:text-earth-800 prose-a:text-clay-600 prose-strong:text-earth-900 prose-li:text-earth-800">
              <MarkdownRenderer content={job.description} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-earth-500 py-10">
              <AlertTriangle size={48} className="mb-4 text-warning-text" />
              <p className="text-lg">No description available for this job.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-pinned action bar */}
      <div className="flex-shrink-0 border-t border-earth-200 bg-earth-50 p-4">
        <JobActionButtons
          job={job}
          isUpdating={isUpdating}
          onUpdateStatus={onUpdateStatus}
          onViewResume={onViewResume}
          onGenerateResume={onGenerateResume}
          onViewCoverLetter={onViewCoverLetter}
          onGenerateCoverLetter={onGenerateCoverLetter}
        />
      </div>
    </div>
  );
}
