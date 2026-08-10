import { Suspense } from "react";
import {
  getJobsByBucket,
  getJobsByBucketCount,
  getTotalJobsCount,
  JobBucket,
} from "@/lib/supabase/queries";
import { Job } from "@/types";
import TopMatchesList from "@/components/jobs/TopMatchesList";
import JobListSkeleton from "@/components/jobs/JobListSkeleton";
import SearchComponent from "@/components/jobs/SearchComponent";
import RefreshButton from "@/components/jobs/RefreshButton";
import StatsCards from "@/components/jobs/StatsCards";
import BucketFilterButtons from "@/components/jobs/BucketFilterButtons";
import FilterButton from "@/components/jobs/FilterButton";
import ScrapedTodayToggle from "@/components/jobs/ScrapedTodayToggle";

const PAGE_SIZE = 10;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params?.page as string) || 1;
  const searchQuery = params?.query as string;
  const bucket = (params?.bucket as JobBucket) || "all";

  const providerParam = params?.provider as string;
  const provider = providerParam && providerParam !== "all" ? providerParam : undefined;

  const minScoreParam = params?.minScore as string;
  const maxScoreParam = params?.maxScore as string;
  const minScore = minScoreParam ? parseInt(minScoreParam) : undefined;
  const maxScore = maxScoreParam ? parseInt(maxScoreParam) : undefined;

  const dateFrom = params?.dateFrom as string;
  const dateTo = params?.dateTo as string;

  const scrapedFrom = params?.scrapedFrom as string;
  const scrapedTo = params?.scrapedTo as string;

  const [jobs, totalCount, total, applied, inProgress, notInterested, rejected, expired] =
    await Promise.all([
      getJobsByBucket(bucket, currentPage, PAGE_SIZE, searchQuery, provider, minScore, maxScore, dateFrom, dateTo, scrapedFrom, scrapedTo),
      getJobsByBucketCount(bucket, searchQuery, provider, minScore, maxScore, dateFrom, dateTo, scrapedFrom, scrapedTo),
      getTotalJobsCount(),
      getJobsByBucketCount("applied"),
      getJobsByBucketCount("in_progress"),
      getJobsByBucketCount("not_interested"),
      getJobsByBucketCount("rejected"),
      getJobsByBucketCount("expired"),
    ]);

  const counts: Record<JobBucket, number> = {
    all: total,
    applied,
    in_progress: inProgress,
    not_interested: notInterested,
    rejected,
    expired,
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="h-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 gap-5 overflow-hidden">
      <div className="flex-shrink-0">
        <StatsCards counts={counts} activeBucket={bucket} />
      </div>

      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <BucketFilterButtons />
          <ScrapedTodayToggle />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchComponent />
          <FilterButton scrapedDateOptions />
          <RefreshButton currentPage={currentPage} />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Suspense fallback={<JobListSkeleton fillHeight />}>
          <TopMatchesList
            jobs={jobs as Job[]}
            currentPage={currentPage}
            totalPages={totalPages}
            hideHeader
            fillHeight
          />
        </Suspense>
      </div>
    </div>
  );
}

export const revalidate = 0;
