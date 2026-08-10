import { Suspense } from "react";
import RefreshButton from "@/components/jobs/RefreshButton";
import { Job } from "@/types";
import JobListSkeleton from "@/components/jobs/JobListSkeleton";
import { getAllActiveJobsCount, getNewJobs } from "@/lib/supabase/queries";
import TopMatchesList from "@/components/jobs/TopMatchesList";
import SearchComponent from "@/components/jobs/SearchComponent";
import FilterButton from "@/components/jobs/FilterButton";
import { getProviderLabel } from "@/lib/jobs/providers";

const PAGE_SIZE = 10; // Define page size

export default async function NewJobsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  // Get current page from search params, default to 1
  const currentPage = parseInt(params?.page as string) || 1;

  // Get search query from search params
  const searchQuery = params?.query as string;

  // Get provider filter from search params
  const provider = params?.provider as string;
  const providerFilter = provider && provider !== "all" ? provider : undefined;

  // Get interest filter from search params
  const interestParam = params?.interest as string;
  let interestFilter: boolean | null | undefined = undefined;
  if (interestParam === "true") {
    interestFilter = true;
  } else if (interestParam === "false") {
    interestFilter = false;
  } else if (interestParam === "null") {
    interestFilter = null;
  }

  // Get resume score filter from search params
  const minScoreParam = params?.minScore as string;
  const maxScoreParam = params?.maxScore as string;
  const scoreStatusParam = params?.scoreStatus as string;
  const customResumeParam = params?.customResume as string;

  const minScore = minScoreParam ? parseInt(minScoreParam) : undefined;
  const maxScore = maxScoreParam ? parseInt(maxScoreParam) : undefined;
  const scoreStatus =
    scoreStatusParam === "pending" || scoreStatusParam === "scored"
      ? scoreStatusParam
      : undefined;
  const customResumeStatus =
    customResumeParam === "missing" || customResumeParam === "present"
      ? customResumeParam
      : undefined;

  // Get posted date range filter from search params
  const dateFrom = params?.dateFrom as string;
  const dateTo = params?.dateTo as string;

  // Fetch the jobs for the current page
  const newJobs: Job[] = await getNewJobs(
    currentPage,
    PAGE_SIZE,
    providerFilter,
    minScore,
    maxScore,
    interestFilter, // Pass interestFilter
    searchQuery, // Pass searchQuery
    scoreStatus,
    customResumeStatus,
    dateFrom,
    dateTo
  );

  // Fetch total count
  const totalCount = await getAllActiveJobsCount(
    providerFilter,
    minScore,
    maxScore,
    interestFilter, // Pass interestFilter
    searchQuery, // Pass searchQuery
    scoreStatus,
    customResumeStatus,
    dateFrom,
    dateTo
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const pageTitle =
    scoreStatus === "pending"
      ? "Pending Scoring"
      : customResumeStatus === "missing"
        ? "Jobs Without Custom Resumes"
        : providerFilter
          ? `${getProviderLabel(providerFilter)} Jobs`
          : "New Jobs";

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header with actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-earth-500">
            {pageTitle} ({totalCount} total)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <SearchComponent />
          <FilterButton />
          <RefreshButton currentPage={currentPage} />
        </div>
      </div>

      {/* Main content with loading state */}
      <Suspense fallback={<JobListSkeleton />}>
        <TopMatchesList
          jobs={newJobs}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}

// Optional: Add revalidation if needed
export const revalidate = 3600; // Revalidate once per hour
