const PROVIDER_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  careers_future: "MyCareersFuture",
  jobstreet: "JobStreet",
  careers_gov: "Careers@Gov",
};

export function getProviderLabel(provider: string | null | undefined): string {
  if (!provider) return "Unknown";
  return PROVIDER_LABELS[provider] ?? provider;
}

/**
 * Builds the original job listing URL from provider + job_id.
 * careers_gov's job_id is an Algolia objectID ("HRP:{id}/{uuid}" or
 * "GREENHOUSE:{id}") where the part after the source prefix already matches
 * the site's URL path suffix.
 */
export function getJobUrl(job: { provider: string; job_id: string }): string {
  switch (job.provider) {
    case "careers_future":
      return `https://www.mycareersfuture.gov.sg/job/${job.job_id}`;
    case "jobstreet":
      return `https://sg.jobstreet.com/job/${job.job_id}`;
    case "careers_gov":
      if (job.job_id.startsWith("HRP:")) {
        return `https://jobs.careers.gov.sg/jobs/hrp/${job.job_id.slice(4)}`;
      }
      if (job.job_id.startsWith("GREENHOUSE:")) {
        return `https://jobs.careers.gov.sg/jobs/greenhouse/${job.job_id.slice(11)}`;
      }
      return "https://jobs.careers.gov.sg/";
    case "linkedin":
    default:
      return `https://www.linkedin.com/jobs/view/${job.job_id}`;
  }
}
