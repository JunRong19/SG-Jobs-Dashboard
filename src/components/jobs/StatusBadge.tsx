import { CheckCircle, Calendar, BadgeCheck, XCircle } from "lucide-react";

// Applied-jobs pipeline status options, in earth tones
export const JOB_STATUS_OPTIONS = [
  {
    value: "applied",
    label: "Applied",
    icon: CheckCircle,
    color: "bg-success-bg text-success-text border border-transparent",
  },
  {
    value: "interviewing",
    label: "Interviewing",
    icon: Calendar,
    color: "bg-amber-50 text-amber-700 border border-transparent",
  },
  {
    value: "offered",
    label: "Offered",
    icon: BadgeCheck,
    color: "bg-success-bg text-success-text border border-transparent",
  },
  {
    value: "rejected",
    label: "Rejected",
    icon: XCircle,
    color: "bg-rose-50 text-rose-700 border border-transparent",
  },
];

export function PipelineStatusBadge({ status }: { status: string }) {
  const option =
    JOB_STATUS_OPTIONS.find((o) => o.value === status) ?? JOB_STATUS_OPTIONS[0];
  const Icon = option.icon;
  return (
    <div
      className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${option.color}`}
    >
      <Icon className="h-4 w-4 mr-1.5" />
      {option.label}
    </div>
  );
}
