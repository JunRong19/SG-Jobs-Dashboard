import { Job } from "@/types";
import { formatJobDateOnly, getJobPostingDate } from "@/lib/jobs/dates";
import { MapPinIcon, CalendarDays, Link as SocialLink } from "lucide-react";
import CompanyAvatar from "./CompanyAvatar";
import { getProviderLabel } from "@/lib/jobs/providers";

export default function JobDetailHeader({ job }: { job: Job }) {
  const providerLabel = getProviderLabel(job.provider);

  return (
    <div className="flex items-start gap-4">
      <CompanyAvatar company={job.company} size="lg" />

      <div>
        <h2 className="text-2xl font-bold text-earth-900">{job.job_title}</h2>
        <p className="mt-1 text-sm font-medium text-earth-700">
          {job.company}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-earth-700 text-sm">
          <span className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1.5 text-earth-500" />
            {job.location}
          </span>
          <span className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-1.5 text-earth-500" />
            Posted {formatJobDateOnly(getJobPostingDate(job))}
          </span>
          <span className="flex items-center capitalize">
            <SocialLink className="h-4 w-4 mr-1.5 text-earth-500" />
            {providerLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
