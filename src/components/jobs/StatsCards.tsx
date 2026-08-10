import { JOB_BUCKETS } from "@/lib/jobs/buckets";
import { JobBucket } from "@/lib/supabase/queries";

interface StatsCardsProps {
  counts: Record<JobBucket, number>;
  activeBucket: JobBucket;
}

export default function StatsCards({ counts, activeBucket }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {JOB_BUCKETS.map((bucket) => {
        const Icon = bucket.icon;
        const isActive = bucket.value === activeBucket;
        return (
          <div
            key={bucket.value}
            className={`bg-earth-50 rounded-xl border shadow-sm overflow-hidden transition-colors duration-200 ${
              isActive
                ? "border-clay-300 ring-1 ring-clay-300"
                : "border-earth-200"
            }`}
          >
            <div className={`h-1 ${bucket.accentBg}`} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${bucket.chipBg} ${bucket.chipText}`}
                >
                  <Icon size={14} />
                </span>
                <span className="text-2xl font-bold text-earth-900">
                  {counts[bucket.value]}
                </span>
              </div>
              <p className="text-xs font-medium text-earth-600">
                {bucket.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
