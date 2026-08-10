"use client";

import { CalendarClock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getLocalTodayKey } from "@/lib/jobs/dates";

export default function ScrapedTodayToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getLocalTodayKey();

  const isActive =
    searchParams.get("scrapedFrom") === today &&
    searchParams.get("scrapedTo") === today;

  const handleToggle = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive) {
      params.delete("scrapedFrom");
      params.delete("scrapedTo");
    } else {
      // Mutually exclusive with the bucket row — behaves like its own
      // bucket ("only today's scraped jobs"), not a filter stacked on
      // top of whichever bucket happened to be selected.
      params.delete("bucket");
      params.set("scrapedFrom", today);
      params.set("scrapedTo", today);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isActive}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-clay-400 focus-visible:ring-offset-2 focus-visible:ring-offset-earth-50 ${
        isActive
          ? "bg-clay-500 text-earth-50 border-transparent"
          : "bg-earth-50 border-earth-200 text-earth-700 hover:bg-earth-100 hover:border-earth-300"
      }`}
    >
      <CalendarClock className="h-4 w-4" />
      Scraped Today
    </button>
  );
}
