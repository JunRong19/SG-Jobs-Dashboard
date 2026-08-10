"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Job } from "@/types";
import {
  PipelineStatus,
  pipelineStatusUpdatePayload,
} from "@/lib/jobs/pipelineStatus";

export function useJobActions(initialJob: Job) {
  const [job, setJob] = useState<Job>(initialJob);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const showToast = (message: string, type: "success" | "error") => {
    // Placeholder for a proper toast library
    console.log(`Toast (${type}): ${message}`);
    if (type === "error") {
      alert(message);
    }
  };

  const viewResume = (
    job_id: string,
    resume_id: string | null | undefined
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("source", window.location.pathname);
    router.push(
      `/jobs/${encodeURIComponent(job_id)}/resumes/${resume_id}?${params.toString()}`
    );
  };

  const viewCoverLetter = (
    job_id: string,
    coverLetterId: string | null | undefined
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("source", window.location.pathname);
    router.push(
      `/jobs/${encodeURIComponent(job_id)}/cover-letters/${coverLetterId}?${params.toString()}`
    );
  };

  const generateResume = async () => {
    try {
      const response = await fetch(
        `/api/jobs/${encodeURIComponent(job.job_id)}/generate-resume`,
        { method: "POST" }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.details ||
            errorData?.error ||
            `HTTP error! status: ${response.status}`
        );
      }

      const { job: updatedJob } = await response.json();
      setJob(updatedJob);
      showToast("Resume generated!", "success");
      router.refresh();
    } catch (error) {
      console.error("Error generating resume:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      showToast(`Error: ${message}`, "error");
    }
  };

  const generateCoverLetter = async () => {
    try {
      const response = await fetch(
        `/api/jobs/${encodeURIComponent(job.job_id)}/generate-cover-letter`,
        { method: "POST" }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.details ||
            errorData?.error ||
            `HTTP error! status: ${response.status}`
        );
      }

      const { job: updatedJob } = await response.json();
      setJob(updatedJob);
      showToast("Cover letter generated!", "success");
      router.refresh();
    } catch (error) {
      console.error("Error generating cover letter:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      showToast(`Error: ${message}`, "error");
    }
  };

  const updateStatus = async (value: PipelineStatus | null) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(job.job_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pipelineStatusUpdatePayload(value)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `HTTP error! status: ${response.status}`
        );
      }

      const updatedJob: Job = await response.json();
      setJob(updatedJob);
      showToast(
        value === null ? "Status cleared" : "Job status updated successfully!",
        "success"
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating job status:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      showToast(`Error: ${message}`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    job,
    setJob,
    isUpdating,
    updateStatus,
    viewResume,
    viewCoverLetter,
    generateResume,
    generateCoverLetter,
  };
}
