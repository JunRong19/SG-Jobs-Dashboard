import { Suspense } from "react";
import { getJobsForDocuments } from "@/lib/supabase/queries";
import { listInFlightGenerations } from "@/lib/jobs/generationTracker";
import DocumentsList from "@/components/documents/DocumentsList";
import JobListSkeleton from "@/components/jobs/JobListSkeleton";
import SearchComponent from "@/components/jobs/SearchComponent";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchQuery = params?.query as string;

  const [jobs, inFlight] = await Promise.all([
    getJobsForDocuments(searchQuery),
    Promise.resolve(listInFlightGenerations()),
  ]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">Documents</h1>
          <p className="mt-1 text-sm text-earth-500">
            Resumes and cover letters you&apos;ve generated or are generating.
          </p>
        </div>
        <SearchComponent />
      </div>

      <Suspense fallback={<JobListSkeleton />}>
        <DocumentsList jobs={jobs} initialInFlight={inFlight} />
      </Suspense>
    </div>
  );
}

export const revalidate = 0;
