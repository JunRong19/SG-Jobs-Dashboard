import { Job } from "@/types";

// Local YYYY-MM-DD (browser timezone), matching what native date inputs
// produce and how scrapedFrom/scrapedTo query params are compared.
export function getLocalTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getJobPostingDate(job: Job): string | null {
  return job.posted_at || job.posted_date || job.published_at || job.scraped_at || null;
}

export function formatJobDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "N/A";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(date);
}

export function formatJobDateOnly(dateString: string | null | undefined): string {
  if (!dateString) {
    return "N/A";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

// Sortable YYYY-MM-DD key matching what formatJobDateOnly displays, so jobs
// posted on the same visible day can be grouped together for sorting
// (rather than by their full precise timestamp, which almost never ties).
export function getJobPostingDateKey(job: Job): string {
  const raw = getJobPostingDate(job);
  if (!raw) return "";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    date,
  );
}

// Sortable YYYY-MM-DD key for when a job was scraped, ignoring time-of-day so
// jobs from the same scrape run (whose timestamps differ by seconds) sort as
// one batch.
export function getScrapedDateKey(job: Job): string {
  if (!job.scraped_at) return "";

  const date = new Date(job.scraped_at);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    date,
  );
}
