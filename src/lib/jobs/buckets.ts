import {
  Briefcase,
  CheckCircle,
  Clock,
  ThumbsDown,
  XCircle,
  Archive,
  LucideIcon,
} from "lucide-react";
import { JobBucket } from "@/lib/supabase/queries";

export interface BucketConfig {
  value: JobBucket;
  label: string;
  icon: LucideIcon;
  // Solid tone: stat-card top accent bar.
  accentBg: string;
  // Icon chip: soft surface + matching icon color.
  chipBg: string;
  chipText: string;
}

// Six buckets, six genuinely distinct hues — no two adjacent buckets should
// read as "the same color" at a glance, and none should read as near-black.
export const JOB_BUCKETS: BucketConfig[] = [
  {
    value: "all",
    label: "Total Jobs",
    icon: Briefcase,
    accentBg: "bg-sky-500",
    chipBg: "bg-sky-50",
    chipText: "text-sky-700",
  },
  {
    value: "applied",
    label: "Applied",
    icon: CheckCircle,
    accentBg: "bg-emerald-500",
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
  },
  {
    value: "in_progress",
    label: "In-progress",
    icon: Clock,
    accentBg: "bg-amber-500",
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
  },
  {
    value: "not_interested",
    label: "Not interested",
    icon: ThumbsDown,
    accentBg: "bg-slate-400",
    chipBg: "bg-slate-100",
    chipText: "text-slate-600",
  },
  {
    value: "rejected",
    label: "Rejected",
    icon: XCircle,
    accentBg: "bg-rose-500",
    chipBg: "bg-rose-50",
    chipText: "text-rose-700",
  },
  {
    value: "expired",
    label: "Expired",
    icon: Archive,
    accentBg: "bg-stone-500",
    chipBg: "bg-stone-100",
    chipText: "text-stone-700",
  },
];
