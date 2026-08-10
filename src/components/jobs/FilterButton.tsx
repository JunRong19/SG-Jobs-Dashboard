"use client";

import { Filter, ChevronDown, Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterOption {
  value: string;
  label: string;
}

const PROVIDER_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Providers" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "careers_future", label: "Careers Future" },
  { value: "jobstreet", label: "JobStreet" },
  { value: "careers_gov", label: "Careers@Gov" },
];

const APPLICATION_STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Application Statuses" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" }, // Matched to SQL function
  { value: "rejected", label: "Rejected" },
];

interface FilterButtonProps {
  disabled?: boolean;
  className?: string;
  providerOptions?: boolean;
  scoreOptions?: boolean;
  applicationStatusOptions?: boolean; // New prop
  dateOptions?: boolean;
  scrapedDateOptions?: boolean;
}

export default function FilterButton({
  disabled = false,
  className = "",
  providerOptions = true,
  scoreOptions = true,
  applicationStatusOptions = false, // New prop with default false
  dateOptions = true,
  scrapedDateOptions = false,
}: FilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [selectedApplicationStatus, setSelectedApplicationStatus] =
    useState("all"); // New state
  const [minScore, setMinScore] = useState<string>("50");
  const [maxScore, setMaxScore] = useState<string>("100");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [scrapedFrom, setScrapedFrom] = useState<string>("");
  const [scrapedTo, setScrapedTo] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  useEffect(() => {
    const provider = searchParams.get("provider") || "all";
    setSelectedProvider(provider);

    const status = searchParams.get("applicationStatus") || "all"; // New: Initialize from URL
    setSelectedApplicationStatus(status);

    const urlMinScore = searchParams.get("minScore");
    if (urlMinScore) setMinScore(urlMinScore);

    const urlMaxScore = searchParams.get("maxScore");
    if (urlMaxScore) setMaxScore(urlMaxScore);

    setDateFrom(searchParams.get("dateFrom") || "");
    setDateTo(searchParams.get("dateTo") || "");

    setScrapedFrom(searchParams.get("scrapedFrom") || "");
    setScrapedTo(searchParams.get("scrapedTo") || "");
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      if (isOpen) {
        // Force re-render on resize to recalculate position
        setIsOpen(false);
        setTimeout(() => setIsOpen(true), 0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Provider filter
    if (selectedProvider === "all") {
      params.delete("provider");
    } else {
      params.set("provider", selectedProvider);
    }

    // Application Status filter (New)
    if (selectedApplicationStatus === "all") {
      params.delete("applicationStatus");
    } else {
      params.set("applicationStatus", selectedApplicationStatus);
    }

    // Score filter
    const min = parseInt(minScore);
    const max = parseInt(maxScore);

    if (!isNaN(min) && min >= 0 && min <= 100) {
      if (min === 50 && params.get("maxScore") === "100") {
        if (max === 100 || !params.has("maxScore")) params.delete("minScore");
        else params.set("minScore", min.toString());
      } else {
        params.set("minScore", min.toString());
      }
    } else {
      params.delete("minScore");
    }

    if (!isNaN(max) && max >= 0 && max <= 100) {
      if (max === 100 && params.get("minScore") === "50") {
        if (min === 50 || !params.has("minScore")) params.delete("maxScore");
        else params.set("maxScore", max.toString());
      } else {
        params.set("maxScore", max.toString());
      }
    } else {
      params.delete("maxScore");
    }

    // Posted date range filter
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    } else {
      params.delete("dateFrom");
    }

    if (dateTo) {
      params.set("dateTo", dateTo);
    } else {
      params.delete("dateTo");
    }

    // Scraped date range filter
    if (scrapedFrom) {
      params.set("scrapedFrom", scrapedFrom);
    } else {
      params.delete("scrapedFrom");
    }

    if (scrapedTo) {
      params.set("scrapedTo", scrapedTo);
    } else {
      params.delete("scrapedTo");
    }

    // Reset to page 1 when filtering
    params.delete("page");

    const newUrl = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname;
    router.push(newUrl);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedProvider("all");
    setSelectedApplicationStatus("all"); // New: Reset application status
    setMinScore("50");
    setMaxScore("100");
    setDateFrom("");
    setDateTo("");
    setScrapedFrom("");
    setScrapedTo("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("provider");
    params.delete("applicationStatus"); // New: Clear application status from params
    params.delete("minScore");
    params.delete("maxScore");
    params.delete("dateFrom");
    params.delete("dateTo");
    params.delete("scrapedFrom");
    params.delete("scrapedTo");
    params.delete("page");

    const newUrl = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname;
    router.push(newUrl);
    setIsOpen(false);
  };

  const handleProviderSelect = (providerValue: string) => {
    setSelectedProvider(providerValue);
  };

  const handleApplicationStatusSelect = (statusValue: string) => {
    // New handler
    setSelectedApplicationStatus(statusValue);
  };

  const getDropdownStyles = () => {
    if (!buttonRef.current) return {};

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640; // sm breakpoint
    const isTablet = window.innerWidth < 1024; // lg breakpoint

    if (isMobile) {
      // Mobile: Full width modal-style
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100vw - 32px)",
        maxWidth: "400px",
        maxHeight: "80vh",
      };
    } else if (isTablet) {
      // Tablet: Positioned near button but responsive
      return {
        top: buttonRect.bottom + 8,
        right: window.innerWidth - buttonRect.right,
        width: "360px",
        maxHeight: `${window.innerHeight - buttonRect.bottom - 20}px`,
      };
    } else {
      // Desktop: Wider dropdown with grid layout
      return {
        top: buttonRect.bottom + 8,
        right: window.innerWidth - buttonRect.right,
        width: "480px",
        maxHeight: `${window.innerHeight - buttonRect.bottom - 20}px`,
      };
    }
  };

  const currentMinScore = searchParams.get("minScore");
  const currentMaxScore = searchParams.get("maxScore");
  const currentProvider = searchParams.get("provider");
  const currentApplicationStatus = searchParams.get("applicationStatus"); // New
  const currentDateFrom = searchParams.get("dateFrom");
  const currentDateTo = searchParams.get("dateTo");
  const currentScrapedFrom = searchParams.get("scrapedFrom");
  const currentScrapedTo = searchParams.get("scrapedTo");

  const hasActiveProviderFilter = currentProvider && currentProvider !== "all";
  const hasActiveApplicationStatusFilter =
    currentApplicationStatus && currentApplicationStatus !== "all"; // New
  const hasActiveScoreFilter =
    (currentMinScore && currentMinScore !== "50") ||
    (currentMaxScore && currentMaxScore !== "100");
  const hasActiveDateFilter = Boolean(currentDateFrom || currentDateTo);
  const hasActiveScrapedDateFilter = Boolean(
    currentScrapedFrom || currentScrapedTo,
  );

  const isActive =
    hasActiveProviderFilter ||
    hasActiveScoreFilter ||
    hasActiveApplicationStatusFilter || // New
    hasActiveDateFilter ||
    hasActiveScrapedDateFilter;

  // Determine button text
  let buttonText = "Filter";
  const activeFilterParts = [];
  if (hasActiveProviderFilter) {
    const providerOption = PROVIDER_OPTIONS.find(
      (opt) => opt.value === currentProvider
    );
    activeFilterParts.push(providerOption ? providerOption.label : "Provider");
  }
  if (hasActiveApplicationStatusFilter) {
    // New
    const statusOption = APPLICATION_STATUS_OPTIONS.find(
      (opt) => opt.value === currentApplicationStatus
    );
    activeFilterParts.push(statusOption ? statusOption.label : "App. Status");
  }
  if (hasActiveScoreFilter) {
    activeFilterParts.push(
      `Score: ${currentMinScore || "Any"}-${currentMaxScore || "Any"}`
    );
  }
  if (hasActiveDateFilter) {
    activeFilterParts.push(
      `Posted: ${currentDateFrom || "Any"} to ${currentDateTo || "Any"}`
    );
  }
  if (hasActiveScrapedDateFilter) {
    activeFilterParts.push(
      `Scraped: ${currentScrapedFrom || "Any"} to ${currentScrapedTo || "Any"}`
    );
  }

  if (activeFilterParts.length > 0) {
    buttonText = activeFilterParts.join(" & ");
    if (buttonText.length > 20) {
      buttonText = `${activeFilterParts.length} Filters Active`;
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
          isActive
            ? "bg-clay-50 border-clay-200 text-clay-700 shadow-sm"
            : "bg-earth-50 border-earth-200 text-earth-700 hover:bg-earth-100 hover:border-earth-300 shadow-sm"
        } ${className}`}
      >
        <Filter className="h-4 w-4" />
        <span>{buttonText}</span>
        {isActive && <div className="w-2 h-2 bg-clay-500 rounded-full"></div>}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu - Responsive positioning */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-earth-900/20 sm:bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          {/* Responsive dropdown */}
          <div
            ref={dropdownRef}
            className="fixed z-50 bg-earth-50 border border-earth-200 rounded-2xl shadow-xl overflow-hidden"
            style={getDropdownStyles()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-earth-200 bg-earth-100/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-earth-900">Filters</h3>
                {isActive && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-earth-500 hover:text-earth-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto"
              style={{
                maxHeight:
                  window.innerWidth < 640
                    ? "60vh"
                    : buttonRef.current
                    ? `${
                        window.innerHeight -
                        buttonRef.current.getBoundingClientRect().bottom -
                        140
                      }px`
                    : "50vh",
              }}
            >
              {/* Provider Filter Section */}
              {providerOptions && (
                <div className="p-4 sm:p-6 border-b border-earth-200">
                  <h4 className="text-sm font-medium text-earth-900 mb-3">
                    Provider
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {PROVIDER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleProviderSelect(option.value)}
                        className={`text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-center justify-between group ${
                          selectedProvider === option.value
                            ? "bg-clay-50 text-clay-700 border border-clay-200"
                            : "text-earth-700 hover:bg-earth-100 border border-transparent"
                        }`}
                      >
                        <span className="font-medium truncate">
                          {option.label}
                        </span>
                        {selectedProvider === option.value && (
                          <Check className="h-4 w-4 text-clay-600 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Status Filter Section (New) */}
              {applicationStatusOptions && (
                <div className="p-4 sm:p-6 border-b border-earth-200">
                  <h4 className="text-sm font-medium text-earth-900 mb-3">
                    Application Status
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {APPLICATION_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleApplicationStatusSelect(option.value)
                        }
                        className={`text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-center justify-between group ${
                          selectedApplicationStatus === option.value
                            ? "bg-clay-50 text-clay-700 border border-clay-200"
                            : "text-earth-700 hover:bg-earth-100 border border-transparent"
                        }`}
                      >
                        <span className="font-medium truncate">
                          {option.label}
                        </span>
                        {selectedApplicationStatus === option.value && (
                          <Check className="h-4 w-4 text-clay-600 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Filter Section */}
              {scoreOptions && (
                <div className="p-4 sm:p-6">
                  <h4 className="text-sm font-medium text-earth-900 mb-3">
                    Resume Score Range
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-medium text-earth-600 mb-2">
                          Minimum
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={minScore}
                          onChange={(e) => setMinScore(e.target.value)}
                          className="w-full px-3 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-clay-500/20 focus:border-clay-500 text-sm transition-colors"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-earth-600 mb-2">
                          Maximum
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={maxScore}
                          onChange={(e) => setMaxScore(e.target.value)}
                          className="w-full px-3 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-clay-500/20 focus:border-clay-500 text-sm transition-colors"
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-earth-500">
                      <span>0</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Posted Date Range Filter Section */}
              {dateOptions && (
                <div className="p-4 sm:p-6 border-t border-earth-200">
                  <h4 className="text-sm font-medium text-earth-900 mb-3">
                    Posted Date Range
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-earth-600 mb-2">
                        From
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-clay-500/20 focus:border-clay-500 text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-earth-600 mb-2">
                        To
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-clay-500/20 focus:border-clay-500 text-sm transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Scraped Date Range Filter Section */}
              {scrapedDateOptions && (
                <div className="p-4 sm:p-6 border-t border-earth-200">
                  <h4 className="text-sm font-medium text-earth-900 mb-3">
                    Scraped Date Range
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-earth-600 mb-2">
                        From
                      </label>
                      <input
                        type="date"
                        value={scrapedFrom}
                        max={scrapedTo || undefined}
                        onChange={(e) => setScrapedFrom(e.target.value)}
                        className="w-full px-3 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-clay-500/20 focus:border-clay-500 text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-earth-600 mb-2">
                        To
                      </label>
                      <input
                        type="date"
                        value={scrapedTo}
                        min={scrapedFrom || undefined}
                        onChange={(e) => setScrapedTo(e.target.value)}
                        className="w-full px-3 py-2.5 border border-earth-200 rounded-lg focus:ring-2 focus:ring-clay-500/20 focus:border-clay-500 text-sm transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-earth-200 bg-earth-100/50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-earth-700 bg-earth-50 border border-earth-200 rounded-lg hover:bg-earth-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-earth-50 bg-clay-500 rounded-lg hover:bg-clay-600 transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
