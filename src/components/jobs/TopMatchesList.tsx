"use client";

import { useState, useEffect, useRef } from "react";
import PaginationControls from "./PaginationControls";
import { BuildingIcon } from "lucide-react";
import { Job } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useJobActions } from "@/lib/jobs/useJobActions";
import JobCard from "./JobCard";
import JobDetailPanel from "./JobDetailPanel";

interface TopMatchesListProps {
  jobs: Job[];
  currentPage: number;
  totalPages: number;
  hideHeader?: boolean;
  fillHeight?: boolean;
}

export default function TopMatchesList({
  jobs,
  currentPage,
  totalPages,
  hideHeader = false,
  fillHeight = false,
}: TopMatchesListProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [currentPage]);

  const {
    job: activeJob,
    setJob: setActiveJob,
    isUpdating,
    updateStatus,
    viewResume,
    viewCoverLetter,
    generateResume,
    generateCoverLetter,
  } = useJobActions(selectedJob ?? jobs[0]);

  useEffect(() => {
    const selectedJobIdFromUrl = searchParams.get("selectedJobId");
    let jobToSelect: Job | null = null;

    if (selectedJobIdFromUrl) {
      jobToSelect =
        jobs.find((job) => job.job_id === selectedJobIdFromUrl) || null;
    }

    if (!jobToSelect && jobs.length > 0) {
      jobToSelect = jobs[0];
      if (!selectedJobIdFromUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("selectedJobId", jobToSelect.job_id);
        router.replace(`${window.location.pathname}?${params.toString()}`, {
          scroll: false,
        });
      }
    } else if (jobs.length === 0) {
      jobToSelect = null;
    }

    if (selectedJob?.job_id !== jobToSelect?.job_id) {
      setSelectedJob(jobToSelect);
      if (jobToSelect) setActiveJob(jobToSelect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, searchParams]);

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setActiveJob(job);
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedJobId", job.job_id);
    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="bg-earth-100 p-6 rounded-full mb-4">
        <BuildingIcon className="h-12 w-12 text-earth-400" />
      </div>
      <h3 className="text-lg font-medium text-earth-900 mb-2">No jobs found</h3>
      <p className="text-earth-500 max-w-sm">
        No jobs found for this filter. Try adjusting your search or checking
        back later.
      </p>
    </div>
  );

  return (
    <div
      className={`flex flex-col md:flex-row gap-4 bg-earth-50 rounded-lg overflow-hidden border border-earth-200 shadow-sm ${
        fillHeight ? "h-full" : "h-[calc(100vh-13rem)]"
      }`}
    >
      {/* Left Column: Job List */}
      <div className="w-full md:w-2/5 bg-earth-50 border-r border-earth-200 flex flex-col min-h-0">
        {!hideHeader && (
          <div className="p-4 border-b border-earth-200">
            <h2 className="text-lg font-semibold text-earth-900">
              Job Matches
            </h2>
            <p className="text-sm text-earth-500">
              {jobs.length} {jobs.length === 1 ? "result" : "results"} found
            </p>
          </div>
        )}

        {jobs.length > 0 ? (
          <>
            <ul
              ref={listRef}
              className="divide-y divide-earth-200 overflow-y-auto flex-grow"
            >
              {jobs.map((job) => (
                <JobCard
                  key={job.job_id}
                  job={job}
                  isSelected={selectedJob?.job_id === job.job_id}
                  onSelect={() => handleJobSelect(job)}
                />
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="p-4 border-t border-earth-200 bg-earth-50">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Right Column: Job Details */}
      <div className="w-full md:w-3/5 bg-earth-50 overflow-hidden min-h-0">
        {selectedJob ? (
          <JobDetailPanel
            job={activeJob}
            isUpdating={isUpdating}
            onUpdateStatus={updateStatus}
            onViewResume={viewResume}
            onGenerateResume={generateResume}
            onViewCoverLetter={viewCoverLetter}
            onGenerateCoverLetter={generateCoverLetter}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <EmptyState />
          </div>
        )}
      </div>
    </div>
  );
}
