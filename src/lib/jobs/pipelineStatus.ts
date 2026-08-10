import { CheckCircle, Clock, ThumbsDown, XCircle, LucideIcon } from "lucide-react";
import { Job } from "@/types";

export type PipelineStatus =
  | "applied"
  | "in_progress"
  | "not_interested"
  | "rejected";

export interface PipelineStatusOption {
  value: PipelineStatus;
  label: string;
  icon: LucideIcon;
  colorClasses: string;
}

export const PIPELINE_STATUS_OPTIONS: PipelineStatusOption[] = [
  {
    value: "applied",
    label: "Applied",
    icon: CheckCircle,
    colorClasses: "bg-success-bg text-success-text border border-transparent",
  },
  {
    value: "in_progress",
    label: "In-Progress",
    icon: Clock,
    colorClasses: "bg-amber-50 text-amber-700 border border-transparent",
  },
  {
    value: "not_interested",
    label: "Not Interested",
    icon: ThumbsDown,
    colorClasses: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  {
    value: "rejected",
    label: "Rejected",
    icon: XCircle,
    colorClasses: "bg-rose-50 text-rose-700 border border-transparent",
  },
];

// A job's pipeline status is derived from two underlying columns: `status`
// (applied/interviewing/offer/rejected/new) and `is_interested`. Returns
// null for jobs that haven't been triaged yet (status "new", interest unset).
export function derivePipelineStatus(job: Job): PipelineStatus | null {
  if (job.is_interested === false) return "not_interested";
  if (job.status === "applied") return "applied";
  if (job.status === "interviewing" || job.status === "offer")
    return "in_progress";
  if (job.status === "rejected") return "rejected";
  return null;
}

// Selecting a pipeline status writes to whichever underlying column(s) it
// maps to, and clears the other axis so a job only ever matches one bucket.
// `null` clears both axes, returning the job to untriaged.
export function pipelineStatusUpdatePayload(
  value: PipelineStatus | null,
): Partial<Job> {
  switch (value) {
    case "applied":
      return {
        status: "applied",
        is_interested: null,
        application_date: new Date().toISOString(),
      };
    case "in_progress":
      return { status: "interviewing", is_interested: null };
    case "rejected":
      return { status: "rejected", is_interested: null };
    case "not_interested":
      return { status: "new", is_interested: false };
    case null:
      return { status: "new", is_interested: null };
  }
}
