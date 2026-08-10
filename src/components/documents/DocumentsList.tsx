"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Mail, ExternalLink } from "lucide-react";
import { Job } from "@/types";
import CompanyAvatar from "@/components/jobs/CompanyAvatar";
import ScoreBadge from "@/components/jobs/ScoreBadge";
import { formatJobDateOnly, getJobPostingDate } from "@/lib/jobs/dates";
import { getProviderLabel, getJobUrl } from "@/lib/jobs/providers";

type GenerationType = "resume" | "cover_letter";

interface InFlightGeneration {
  jobId: string;
  type: GenerationType;
  startedAt: number;
}

interface DocumentsListProps {
  jobs: Job[];
  initialInFlight: InFlightGeneration[];
}

// Rough average observed duration per type — used only to give the progress
// bar a sense of pace. It's an estimate, not a guarantee: the bar caps below
// 100% until the doc actually shows up, rather than claiming false precision.
const ESTIMATED_DURATION_MS: Record<GenerationType, number> = {
  resume: 100_000,
  cover_letter: 20_000,
};

const GENERATE_ENDPOINT: Record<GenerationType, string> = {
  resume: "generate-resume",
  cover_letter: "generate-cover-letter",
};

const DOCUMENT_LABEL: Record<GenerationType, string> = {
  resume: "Resume",
  cover_letter: "Cover letter",
};

const POLL_INTERVAL_MS = 2_000;

function inFlightKey(jobId: string, type: GenerationType) {
  return `${type}:${jobId}`;
}

function GenerationProgress({
  type,
  startedAt,
}: {
  type: GenerationType;
  startedAt: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = Math.max(0, now - startedAt);
  const elapsedSeconds = Math.round(elapsedMs / 1000);
  const percent = Math.min(96, (elapsedMs / ESTIMATED_DURATION_MS[type]) * 100);

  return (
    <div className="w-full">
      <div className="h-1.5 w-full rounded-full bg-earth-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-clay-500 transition-all duration-1000 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-earth-500">Generating... {elapsedSeconds}s</p>
    </div>
  );
}

function DocumentCell({
  job,
  type,
  inFlight,
  onGenerate,
}: {
  job: Job;
  type: GenerationType;
  inFlight: InFlightGeneration | undefined;
  onGenerate: (job: Job, type: GenerationType) => void;
}) {
  const isResume = type === "resume";
  const docId = isResume ? job.customized_resume_id : job.cover_letter_id;
  const Icon = isResume ? FileText : Mail;
  const label = DOCUMENT_LABEL[type];

  if (inFlight) {
    return <GenerationProgress type={type} startedAt={inFlight.startedAt} />;
  }

  if (docId) {
    const href = isResume
      ? `/jobs/${encodeURIComponent(job.job_id)}/resumes/${docId}?source=/documents`
      : `/jobs/${encodeURIComponent(job.job_id)}/cover-letters/${docId}?source=/documents`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-sage-50 text-sage-700 text-xs font-medium hover:bg-sage-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
      >
        <Icon size={14} />
        View {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onGenerate(job, type)}
      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-sage-500 text-earth-50 text-xs font-medium hover:bg-sage-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
    >
      <Icon size={14} />
      Generate {label}
    </button>
  );
}

export default function DocumentsList({ jobs, initialInFlight }: DocumentsListProps) {
  const router = useRouter();
  const [inFlight, setInFlight] = useState<InFlightGeneration[]>(initialInFlight);
  const prevKeysRef = useRef<Set<string>>(
    new Set(initialInFlight.map((g) => inFlightKey(g.jobId, g.type)))
  );

  const showToast = (message: string) => {
    console.error(message);
    alert(message);
  };

  const handleGenerate = (job: Job, type: GenerationType) => {
    const key = inFlightKey(job.job_id, type);
    if (prevKeysRef.current.has(key)) return; // already running, ignore duplicate click

    // Optimistic: show the progress bar immediately rather than waiting for
    // the next poll tick, then let polling reconcile with the server's
    // actual startedAt once it lands.
    prevKeysRef.current.add(key);
    setInFlight((current) => [
      ...current,
      { jobId: job.job_id, type, startedAt: Date.now() },
    ]);

    fetch(`/api/jobs/${encodeURIComponent(job.job_id)}/${GENERATE_ENDPOINT[type]}`, {
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.details || errorData?.error || `HTTP error! status: ${response.status}`
          );
        }
      })
      .catch((error) => {
        showToast(
          `Failed to generate ${DOCUMENT_LABEL[type].toLowerCase()}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      });
  };

  useEffect(() => {
    const poll = async () => {
      try {
        const response = await fetch("/api/generation-status");
        if (!response.ok) return;
        const { inFlight: nextInFlight } = (await response.json()) as {
          inFlight: InFlightGeneration[];
        };

        const nextKeys = new Set(
          nextInFlight.map((g) => inFlightKey(g.jobId, g.type))
        );
        const somethingFinished = Array.from(prevKeysRef.current).some(
          (key) => !nextKeys.has(key)
        );

        prevKeysRef.current = nextKeys;
        setInFlight(nextInFlight);

        if (somethingFinished) {
          router.refresh();
        }
      } catch {
        // Transient poll failure — the next tick will retry.
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

  if (jobs.length === 0) {
    return (
      <div className="bg-earth-50 border border-earth-200 rounded-lg shadow-sm p-10 text-center">
        <p className="text-earth-500">No jobs found.</p>
      </div>
    );
  }

  return (
    <div className="bg-earth-50 border border-earth-200 rounded-lg shadow-sm overflow-hidden">
      <ul className="divide-y divide-earth-200">
        {jobs.map((job) => {
          const resumeInFlight = inFlight.find(
            (g) => g.jobId === job.job_id && g.type === "resume"
          );
          const coverLetterInFlight = inFlight.find(
            (g) => g.jobId === job.job_id && g.type === "cover_letter"
          );

          return (
            <li
              key={job.job_id}
              className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CompanyAvatar company={job.company} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-earth-900 truncate">
                      {job.job_title}
                    </h3>
                    <a
                      href={getJobUrl(job)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View job listing"
                      className="flex-shrink-0 text-earth-400 hover:text-clay-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 rounded"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <p className="mt-0.5 text-sm text-earth-700 truncate">
                    {job.company} · {job.location}
                  </p>
                  <p className="mt-0.5 text-xs text-earth-500 truncate">
                    Posted {formatJobDateOnly(getJobPostingDate(job))} ·{" "}
                    {getProviderLabel(job.provider)}
                  </p>
                </div>
                <ScoreBadge score={job.resume_score} />
              </div>

              <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0 sm:pl-4">
                <div className="w-52 flex-shrink-0">
                  <DocumentCell
                    job={job}
                    type="resume"
                    inFlight={resumeInFlight}
                    onGenerate={handleGenerate}
                  />
                </div>
                <div className="w-52 flex-shrink-0">
                  <DocumentCell
                    job={job}
                    type="cover_letter"
                    inFlight={coverLetterInFlight}
                    onGenerate={handleGenerate}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
