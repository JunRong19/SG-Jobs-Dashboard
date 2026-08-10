import CustomPdfViewer from "@/components/CustomPdfViewer";
import { getCoverLetterById } from "@/lib/supabase/queries";
import { getSignedUrl } from "@/lib/supabase/storage";
import { CoverLetter } from "@/types";
import { notFound } from "next/navigation";

type Params = {
  params: Promise<{ job_id: string; id: string }>;
};

export default async function CoverLetterView({ params }: Params) {
  const { job_id, id } = await params;

  try {
    const coverLetter: CoverLetter | null = await getCoverLetterById(id);

    if (!coverLetter) return notFound();

    let signedUrl = "";
    if (coverLetter.cover_letter_link) {
      try {
        signedUrl = await getSignedUrl(
          coverLetter.cover_letter_link,
          "personalized_cover_letters",
        );
      } catch (err) {
        console.error("Failed to get signed URL for cover letter:", err);
      }
    }

    return (
      <CustomPdfViewer fileUrl={signedUrl} jobId={job_id} showEditButton={false} />
    );
  } catch (error) {
    console.error("Error getting cover letter:", error);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-bold text-red-500">
          Error Loading Cover Letter
        </h1>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    </div>
  );
}
