"use client";

import dynamic from "next/dynamic";

interface CustomPdfViewerProps {
  fileUrl: string;
  jobId?: string;
  showEditButton?: boolean;
}

const CustomPdfViewerClient = dynamic(
  () => import("./CustomPdfViewerClient"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400" />
          <p className="mt-4 font-medium text-gray-600 dark:text-gray-300">
            Loading PDF...
          </p>
        </div>
      </div>
    ),
  },
);

export default function CustomPdfViewer(props: CustomPdfViewerProps) {
  return <CustomPdfViewerClient {...props} />;
}
