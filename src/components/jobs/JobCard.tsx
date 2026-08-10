import { Job } from "@/types";
import { formatJobDateOnly, getJobPostingDate } from "@/lib/jobs/dates";
import ScoreBadge from "./ScoreBadge";
import CompanyAvatar from "./CompanyAvatar";
import {
  PIPELINE_STATUS_OPTIONS,
  derivePipelineStatus,
} from "@/lib/jobs/pipelineStatus";
import { getProviderLabel } from "@/lib/jobs/providers";

interface JobCardProps {
  job: Job;
  isSelected: boolean;
  onSelect: () => void;
}

export default function JobCard({ job, isSelected, onSelect }: JobCardProps) {
  const providerLabel = getProviderLabel(job.provider);
  const pipelineStatus = derivePipelineStatus(job);
  const statusOption = PIPELINE_STATUS_OPTIONS.find(
    (option) => option.value === pipelineStatus,
  );

  return (
    <li
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative px-4 py-3.5 cursor-pointer transition-all duration-150 hover:bg-earth-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-clay-400 focus-visible:z-20 ${
        isSelected
          ? "bg-clay-50 ring-1 ring-inset ring-clay-300 z-10"
          : ""
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <CompanyAvatar company={job.company} />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-earth-900 truncate">
            {job.job_title}
          </h3>
          <p className="mt-0.5 text-sm text-earth-700 truncate">
            {job.company} · {job.location}
          </p>
          <p className="mt-0.5 text-xs text-earth-500 truncate">
            Posted {formatJobDateOnly(getJobPostingDate(job))} · {providerLabel}
          </p>
        </div>

        <ScoreBadge score={job.resume_score} />
      </div>

      {statusOption && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusOption.colorClasses}`}
          >
            <statusOption.icon className="h-3 w-3 mr-1" />
            {statusOption.label}
          </span>
        </div>
      )}
    </li>
  );
}
