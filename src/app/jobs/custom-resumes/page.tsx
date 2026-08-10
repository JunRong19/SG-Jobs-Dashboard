import CustomResumeJobsList from "@/components/jobs/CustomResumeJobsList";

export default async function CustomResumesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return <CustomResumeJobsList searchParams={params} />;
}
