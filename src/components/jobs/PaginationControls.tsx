"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
}

export default function PaginationControls({
  currentPage,
  totalPages,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // Only render pagination if we have more than one page
  if (totalPages <= 1) {
    return null;
  }

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const maxPagesToShow = 3; // Reduced from 5 to 3 for compact view

    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 2) {
      return [1, 2, 3];
    }

    if (currentPage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    }

    return [currentPage - 1, currentPage, currentPage + 1];
  };

  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div className="text-earth-500 text-xs">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center space-x-1">
        {/* Previous button - simplified */}
        <button
          onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center justify-center h-7 w-7 rounded text-earth-600 disabled:text-earth-300 disabled:cursor-not-allowed hover:bg-earth-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-clay-400"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers - compact */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`flex cursor-pointer items-center justify-center h-7 w-7 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-clay-400 ${
              currentPage === page
                ? "bg-clay-600 text-earth-50 hover:bg-clay-700"
                : "text-earth-700 hover:bg-earth-100"
            }`}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {/* Next button - simplified */}
        <button
          onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center cursor-pointer justify-center h-7 w-7 rounded text-earth-600 disabled:text-earth-300 disabled:cursor-not-allowed hover:bg-earth-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-clay-400"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
