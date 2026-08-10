import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import { getJobById } from "@/lib/supabase/queries";
import { getOrStartGeneration } from "@/lib/jobs/generationTracker";

const execFileAsync = promisify(execFile);

// The job-scraper Python backend owns the actual resume-generation logic
// (LLM personalization + PDF + Supabase upload — see custom_resume_generator.py).
// This route just shells out to it locally and re-reads the result from
// Supabase, mirroring the shape generate-cover-letter/route.ts returns.
const JOB_SCRAPER_DIR =
  process.env.JOB_SCRAPER_DIR || path.resolve(process.cwd(), "..", "job-scraper");
const PYTHON_EXECUTABLE = process.env.JOB_SCRAPER_PYTHON || "python";
const GENERATION_TIMEOUT_MS = 5 * 60 * 1000; // personalization runs several LLM calls with rate-limit delays between them

async function runGeneration(job_id: string): Promise<void> {
  try {
    await execFileAsync(
      PYTHON_EXECUTABLE,
      ["generate_resume_for_job.py", job_id],
      { cwd: JOB_SCRAPER_DIR, timeout: GENERATION_TIMEOUT_MS },
    );
  } catch (execError: any) {
    const stderr: string = execError?.stderr || "";
    let details = stderr.trim() || execError?.message || "Unknown error";
    try {
      const parsed = JSON.parse(stderr.trim().split("\n").pop() || "{}");
      if (parsed?.error) details = parsed.error;
    } catch {
      // stderr wasn't JSON — fall back to raw text above
    }
    throw new Error(details);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ job_id: string }> },
) {
  try {
    const { job_id } = await params;
    if (!job_id) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    await getOrStartGeneration(job_id, "resume", () => runGeneration(job_id));

    const updatedJob = await getJobById(job_id);
    if (!updatedJob) {
      throw new Error("Resume generated, but the job could not be reloaded.");
    }
    if (!updatedJob.customized_resume_id) {
      throw new Error("Resume generation finished without attaching a resume to this job.");
    }

    return NextResponse.json({ job: updatedJob }, { status: 200 });
  } catch (error) {
    console.error("Error generating resume:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to generate resume", details: errorMessage },
      { status: 500 },
    );
  }
}
