"use client";

import { useState } from "react";
import Link from "next/link";
import PaginationControls from "./PaginationControls";
import {
  ExternalLink,
  Calendar,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  FileText,
  Briefcase,
  ChevronRight,
  Info,
} from "lucide-react";
import { Job } from "@/types";
import { useRouter } from "next/navigation";
import { formatJobDate, getJobPostingDate } from "@/lib/jobs/dates";
import { getJobUrl } from "@/lib/jobs/providers";
import { JOB_STATUS_OPTIONS, PipelineStatusBadge } from "./StatusBadge";

interface AppliedJobsListProps {
  jobs: Job[];
  currentPage: number;
  totalPages: number;
}

export default function AppliedJobsList({
  jobs,
  currentPage,
  totalPages,
}: AppliedJobsListProps) {
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState<string | null>(null);
  const router = useRouter();

  const handleViewResume = (
    job_id: string,
    resume_id: string | null | undefined
  ) => {
    router.push(`/jobs/${encodeURIComponent(job_id)}/resumes/${resume_id}`);
  };

  const handleStatusChange = async (job: Job, newStatus: string) => {
    setUpdatingJobId(job.job_id);
    setIsStatusMenuOpen(null);

    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(job.job_id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      router.refresh();
      showToast(`Job status updated to ${newStatus} successfully!`, "success");
    } catch (error) {
      console.error("Error updating job status:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      showToast(`Error: ${message}`, "error");
    } finally {
      setUpdatingJobId(null);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    console.log(`Toast (${type}): ${message}`);
    if (type === "error") {
      alert(message);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="bg-earth-100 p-6 rounded-full mb-4">
        <Briefcase className="h-12 w-12 text-earth-400" />
      </div>
      <h3 className="text-lg font-medium text-earth-900 mb-2">
        No applied jobs found
      </h3>
      <p className="text-earth-500 max-w-sm">
        You haven't applied to any jobs yet, or no applied jobs match your
        current filters.
      </p>
    </div>
  );

  return (
    <div className="bg-earth-50 rounded-lg overflow-hidden border border-earth-200 shadow-sm">
      {jobs.length > 0 ? (
        <div className="divide-y divide-earth-200">
          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="bg-earth-50 p-5 hover:bg-earth-100 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Job information */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-earth-900">
                    {job.job_title}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-earth-600">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-1.5" />
                      <span>{job.company}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1.5" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1.5" />
                      <span>
                        Applied on {formatDate(job.application_date)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      <span>Posted {formatJobDate(getJobPostingDate(job))}</span>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <PipelineStatusBadge status={job.status || "applied"} />
              </div>

              {/* Actions row */}
              <div className="mt-4 pt-4 border-t border-earth-200 flex flex-wrap items-center justify-between gap-3">
                {/* Left side actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/jobs/${encodeURIComponent(job.job_id)}`}
                    className="inline-flex items-center px-3 py-1.5 bg-earth-50 border border-earth-300 text-earth-700 text-sm rounded-md hover:bg-earth-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-1"
                  >
                    <Info size={14} className="mr-1.5" />
                    View Details
                  </Link>
                  <Link
                    href={getJobUrl(job)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-earth-50 border border-earth-300 text-earth-700 text-sm rounded-md hover:bg-earth-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-1"
                  >
                    View Job Posting
                    <ExternalLink size={14} className="ml-1.5" />
                  </Link>

                  {job.customized_resume_id && (
                    <button
                      onClick={() =>
                        handleViewResume(job.job_id, job.customized_resume_id)
                      }
                      className="inline-flex cursor-pointer items-center px-3 py-1.5 bg-earth-50 border border-earth-300 text-earth-700 text-sm rounded-md hover:bg-earth-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-1"
                    >
                      <FileText size={14} className="mr-1.5" />
                      View Resume
                    </button>
                  )}
                </div>

                {/* Status dropdown */}
                <div className="relative">
                  <button
                    disabled={updatingJobId === job.job_id}
                    onClick={() =>
                      setIsStatusMenuOpen(
                        isStatusMenuOpen === job.job_id ? null : job.job_id
                      )
                    }
                    className="inline-flex items-center px-3 py-1.5 bg-clay-500 text-earth-50 text-sm rounded-md hover:bg-clay-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clay-500 disabled:opacity-50"
                  >
                    {updatingJobId === job.job_id ? (
                      "Updating..."
                    ) : (
                      <>
                        Update Status
                        <ChevronRight
                          size={16}
                          className={`ml-1.5 transition-transform duration-200 ${
                            isStatusMenuOpen === job.job_id ? "rotate-90" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {/* Status dropdown menu */}
                  {isStatusMenuOpen === job.job_id && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-earth-50 ring-1 ring-earth-200 divide-y divide-earth-200 z-50">
                      <div className="py-1">
                        {JOB_STATUS_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() =>
                                handleStatusChange(job, option.value)
                              }
                              className={`w-full text-left px-4 py-2 text-sm flex items-center cursor-pointer hover:bg-earth-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay-500 disabled:cursor-not-allowed ${
                                job.status === option.value
                                  ? "bg-earth-100 font-medium"
                                  : ""
                              }`}
                              disabled={job.status === option.value}
                            >
                              <Icon
                                className={`h-4 w-4 mr-2 ${
                                  job.status === option.value
                                    ? "text-clay-600"
                                    : "text-earth-500"
                                }`}
                              />
                              {option.label}
                              {job.status === option.value && (
                                <CheckCircle2 className="h-4 w-4 ml-auto text-clay-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-5 border-t border-earth-200 bg-earth-50">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
}
