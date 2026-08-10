"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { Job } from "@/types";
import {
  PIPELINE_STATUS_OPTIONS,
  PipelineStatus,
  derivePipelineStatus,
} from "@/lib/jobs/pipelineStatus";

interface JobStatusSelectorProps {
  job: Job;
  isUpdating: boolean;
  onChange: (value: PipelineStatus | null) => void;
}

export default function JobStatusSelector({
  job,
  isUpdating,
  onChange,
}: JobStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = derivePipelineStatus(job);
  const currentOption = PIPELINE_STATUS_OPTIONS.find(
    (option) => option.value === current,
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const CurrentIcon = currentOption?.icon;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isUpdating}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clay-500 ${
          currentOption
            ? currentOption.colorClasses
            : "bg-earth-100 border border-earth-300 text-earth-800 hover:bg-earth-200"
        }`}
      >
        {CurrentIcon && <CurrentIcon size={16} />}
        {isUpdating
          ? "Updating..."
          : currentOption
            ? currentOption.label
            : "Set Status"}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 bottom-full mb-1 w-48 rounded-lg border border-earth-200 bg-earth-50 shadow-lg overflow-hidden animate-dropdown-in">
          {PIPELINE_STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = option.value === current;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (!isActive) onChange(option.value);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                  isActive
                    ? "bg-earth-100 text-earth-900 font-medium"
                    : "text-earth-700 hover:bg-earth-100"
                }`}
              >
                <Icon size={14} />
                {option.label}
                {isActive && (
                  <Check size={14} className="ml-auto text-clay-600" />
                )}
              </button>
            );
          })}

          {current && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onChange(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-earth-500 hover:bg-earth-100 hover:text-earth-700 transition-colors cursor-pointer border-t border-earth-200"
            >
              <X size={14} />
              Clear status
            </button>
          )}
        </div>
      )}
    </div>
  );
}
