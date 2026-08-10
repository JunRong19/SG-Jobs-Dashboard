import { Suspense } from "react";
import {
  getCustomResumeJobs,
  getCustomResumeJobsCount,
} from "@/lib/supabase/queries";
import { Job } from "@/types";
import FilterButton from "@/components/jobs/FilterButton";
import JobListSkeleton from "@/components/jobs/JobListSkeleton";
import RefreshButton from "@/components/jobs/RefreshButton";
import SearchComponent from "@/components/jobs/SearchComponent";
import TopMatchesList from "@/components/jobs/TopMatchesList";

const PAGE_SIZE = 10;

interface CustomResumeJobsListProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CustomResumeJobsList({
  searchParams,
}: CustomResumeJobsListProps) {
  const currentPage = parseInt(searchParams?.page as string) || 1;
  const searchQuery = searchParams?.query as string;
  const provider = searchParams?.provider as string;
  const providerFilter = provider && provider !== "all" ? provider : undefined;

  const interestParam = searchParams?.interest as string;
  let interestFilter: boolean | null | undefined = undefined;
  if (interestParam === "true") {
    interestFilter = true;
  } else if (interestParam === "false") {
    interestFilter = false;
  } else if (interestParam === "null") {
    interestFilter = null;
  }

  const minScoreParam = searchParams?.minScore as string;
  const maxScoreParam = searchParams?.maxScore as string;

  const minScore = minScoreParam ? parseInt(minScoreParam) : undefined;
  const maxScore = maxScoreParam ? parseInt(maxScoreParam) : undefined;

  const jobs: Job[] = await getCustomResumeJobs(
    currentPage,
    PAGE_SIZE,
    providerFilter,
    minScore,
    maxScore,
    interestFilter,
    searchQuery,
  );

  const totalCount = await getCustomResumeJobsCount(
    providerFilter,
    minScore,
    maxScore,
    interestFilter,
    searchQuery,
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">
            Custom Resume Jobs
          </h1>
          <p className="mt-1 text-sm text-earth-500">
            Jobs with custom resumes ({totalCount} total)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <SearchComponent />
          <FilterButton />
          <RefreshButton currentPage={currentPage} />
        </div>
      </div>

      <Suspense fallback={<JobListSkeleton />}>
        <TopMatchesList
          jobs={jobs}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}
