"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Job } from "@/types";
import { ExternalLink, FileText, Mail, Loader2 } from "lucide-react";
import { PipelineStatus } from "@/lib/jobs/pipelineStatus";
import JobStatusSelector from "./JobStatusSelector";
import { getJobUrl } from "@/lib/jobs/providers";

interface JobActionButtonsProps {
  job: Job;
  isUpdating: boolean;
  onUpdateStatus: (value: PipelineStatus | null) => void;
  onViewResume: (jobId: string, resumeId: string | null | undefined) => void;
  onGenerateResume: () => void;
  onViewCoverLetter: (
    jobId: string,
    coverLetterId: string | null | undefined
  ) => void;
  onGenerateCoverLetter: () => void;
}

// Document-action buttons (resume, cover letter) share this slate treatment
// — a color that matches the app's navy accent family without being it, so
// "View Job Listing" (the one main-color action) still reads as the primary.
const DOCUMENT_BUTTON_CLASSES =
  "inline-flex items-center px-4 py-2 bg-sage-500 text-earth-50 text-sm font-medium rounded-md hover:bg-sage-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

type GenerationType = "resume" | "cover_letter";
interface InFlightGeneration {
  jobId: string;
  type: GenerationType;
}

const POLL_INTERVAL_MS = 2_000;

// Generation status is tracked per (job, type) against the same server-side
// tracker /documents polls — NOT as a single shared boolean — so clicking
// Generate on one job never disables the button for a different job. The
// local "justClicked" flag gives instant feedback on click, before the
// first poll tick confirms it server-side; both are reset whenever the
// selected job changes so neither leaks across jobs.
function useIsGenerating(jobId: string, justClicked: {
  resume: boolean;
  coverLetter: boolean;
}) {
  const [inFlight, setInFlight] = useState<InFlightGeneration[]>([]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch("/api/generation-status");
        if (!response.ok || cancelled) return;
        const { inFlight: nextInFlight } = (await response.json()) as {
          inFlight: InFlightGeneration[];
        };
        if (!cancelled) setInFlight(nextInFlight);
      } catch {
        // Transient poll failure — the next tick will retry.
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return {
    resume:
      justClicked.resume ||
      inFlight.some((g) => g.jobId === jobId && g.type === "resume"),
    coverLetter:
      justClicked.coverLetter ||
      inFlight.some((g) => g.jobId === jobId && g.type === "cover_letter"),
  };
}

export default function JobActionButtons({
  job,
  isUpdating,
  onUpdateStatus,
  onViewResume,
  onGenerateResume,
  onViewCoverLetter,
  onGenerateCoverLetter,
}: JobActionButtonsProps) {
  const jobUrl = getJobUrl(job);
  const [justClicked, setJustClicked] = useState({
    resume: false,
    coverLetter: false,
  });

  // Switching jobs must drop any optimistic flag from the previous job —
  // otherwise a click on job A would keep showing "Generating..." on job B.
  useEffect(() => {
    setJustClicked({ resume: false, coverLetter: false });
  }, [job.job_id]);

  const generating = useIsGenerating(job.job_id, justClicked);

  const handleGenerateResume = () => {
    setJustClicked((c) => ({ ...c, resume: true }));
    onGenerateResume();
  };

  const handleGenerateCoverLetter = () => {
    setJustClicked((c) => ({ ...c, coverLetter: true }));
    onGenerateCoverLetter();
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={jobUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 bg-clay-500 text-earth-50 text-sm font-medium rounded-md hover:bg-clay-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clay-500"
      >
        View Job Listing
        <ExternalLink size={16} className="ml-2" />
      </Link>

      <JobStatusSelector
        job={job}
        isUpdating={isUpdating}
        onChange={onUpdateStatus}
      />

      {job.customized_resume_id ? (
        <button
          onClick={() => onViewResume(job.job_id, job.customized_resume_id)}
          className={DOCUMENT_BUTTON_CLASSES}
        >
          View Resume
          <FileText size={16} className="ml-2" />
        </button>
      ) : (
        <button
          onClick={handleGenerateResume}
          disabled={generating.resume}
          className={DOCUMENT_BUTTON_CLASSES}
        >
          {generating.resume ? "Generating..." : "Generate Resume"}
          {generating.resume ? (
            <Loader2 size={16} className="ml-2 animate-spin" />
          ) : (
            <FileText size={16} className="ml-2" />
          )}
        </button>
      )}

      {job.cover_letter_id ? (
        <button
          onClick={() => onViewCoverLetter(job.job_id, job.cover_letter_id)}
          className={DOCUMENT_BUTTON_CLASSES}
        >
          View Cover Letter
          <Mail size={16} className="ml-2" />
        </button>
      ) : (
        <button
          onClick={handleGenerateCoverLetter}
          disabled={generating.coverLetter}
          className={DOCUMENT_BUTTON_CLASSES}
        >
          {generating.coverLetter ? "Generating..." : "Generate Cover Letter"}
          {generating.coverLetter ? (
            <Loader2 size={16} className="ml-2 animate-spin" />
          ) : (
            <Mail size={16} className="ml-2" />
          )}
        </button>
      )}
    </div>
  );
}
