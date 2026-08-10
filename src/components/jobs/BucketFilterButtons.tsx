"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { JOB_BUCKETS } from "@/lib/jobs/buckets";
import { JobBucket } from "@/lib/supabase/queries";
import { getLocalTodayKey } from "@/lib/jobs/dates";

export default function BucketFilterButtons() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getLocalTodayKey();
  const isScrapedTodayActive =
    searchParams.get("scrapedFrom") === today &&
    searchParams.get("scrapedTo") === today;
  // Scraped Today is its own exclusive view (see ScrapedTodayToggle), so no
  // bucket reads as active while it's engaged, mirroring how selecting a
  // bucket clears it below.
  const activeBucket = isScrapedTodayActive
    ? null
    : (searchParams.get("bucket") as JobBucket) || "all";

  const handleSelect = (bucket: JobBucket) => {
    const params = new URLSearchParams(searchParams.toString());
    if (bucket === "all") {
      params.delete("bucket");
    } else {
      params.set("bucket", bucket);
    }
    params.delete("scrapedFrom");
    params.delete("scrapedTo");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {JOB_BUCKETS.map((bucket) => {
        const isActive = activeBucket === bucket.value;
        return (
          <button
            key={bucket.value}
            type="button"
            onClick={() => handleSelect(bucket.value)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-clay-400 focus-visible:ring-offset-2 focus-visible:ring-offset-earth-50 ${
              isActive
                ? `${bucket.chipBg} ${bucket.chipText} border-transparent`
                : "bg-earth-50 border-earth-200 text-earth-700 hover:bg-earth-100 hover:border-earth-300"
            }`}
          >
            {bucket.label}
          </button>
        );
      })}
    </div>
  );
}
