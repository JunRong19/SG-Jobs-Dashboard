"use client";

import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshButton({
  currentPage,
}: {
  currentPage: number;
}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Refresh the current route
    router.refresh();

    // Add a small delay to show the refresh animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="inline-flex cursor-pointer items-center px-3 py-2 border border-earth-300 shadow-sm text-sm font-medium rounded-md text-earth-700 bg-earth-50 hover:bg-earth-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clay-500 disabled:opacity-70"
    >
      <RefreshCcw
        className={`h-4 w-4 mr-2 text-earth-500 ${
          isRefreshing ? "animate-spin" : ""
        }`}
      />
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </button>
  );
}
