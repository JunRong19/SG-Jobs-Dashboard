import ExpiredJobsList from "@/components/jobs/ExpiredJobsList";

export default async function ExpiredJobsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return <ExpiredJobsList searchParams={params} />;
}
