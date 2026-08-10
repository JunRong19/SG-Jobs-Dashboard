import { Job, Resume, CoverLetter } from "@/types";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { PostgrestError } from "@supabase/supabase-js";
import { getJobPostingDateKey, getScrapedDateKey } from "@/lib/jobs/dates";
import { listInFlightGenerations } from "@/lib/jobs/generationTracker";

// Helper function to handle Supabase response errors
async function handleResponse({
  data,
  error,
}: {
  data: any[] | null; // Keep 'any' for flexibility or refine if possible
  error: PostgrestError | null;
}): Promise<any> {
  // Keep 'any' or refine return type
  if (error) {
    console.error("Supabase response error:", error);
    throw new Error(error.message); // Or handle error more gracefully
  }
  // Allow returning empty arrays or potentially null for single results handled elsewhere
  // Removed the !data check here as it might be too strict for all cases
  return data;
}

// --- Query Functions ---

// Jobs display their posting date via posted_at, falling back to scraped_at
// when the scraper didn't set one (LinkedIn never does) — see
// getJobPostingDate in lib/jobs/dates.ts. PostgREST filters can't reference
// a COALESCE expression directly, so this emulates it with an OR of two
// mutually-exclusive AND groups: "posted_at is set and in range" vs.
// "posted_at is unset and scraped_at is in range".
function applyPostingDateRangeFilter(
  query: any,
  dateFrom?: string,
  dateTo?: string,
) {
  if (!dateFrom && !dateTo) return query;

  const fromIso = dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined;
  const toIso = dateTo ? `${dateTo}T23:59:59.999Z` : undefined;

  const rangeConditions = (column: string) =>
    [
      fromIso ? `${column}.gte.${fromIso}` : null,
      toIso ? `${column}.lte.${toIso}` : null,
    ]
      .filter(Boolean)
      .join(",");

  return query.or(
    `and(posted_at.not.is.null,${rangeConditions("posted_at")}),and(posted_at.is.null,${rangeConditions("scraped_at")})`,
  );
}

// Filters on scraped_at directly (when the row was inserted), as opposed to
// applyPostingDateRangeFilter which filters on the job's advertised posting
// date. scraped_at is always set by the scrapers, so this needs no NULL
// fallback handling.
function applyScrapedDateRangeFilter(
  query: any,
  scrapedFrom?: string,
  scrapedTo?: string,
) {
  if (!scrapedFrom && !scrapedTo) return query;

  if (scrapedFrom) {
    query = query.gte("scraped_at", `${scrapedFrom}T00:00:00.000Z`);
  }
  if (scrapedTo) {
    query = query.lte("scraped_at", `${scrapedTo}T23:59:59.999Z`);
  }
  return query;
}

// A plain .gte()/.lte() on resume_score would silently exclude not-yet-scored jobs, since
// SQL NULL comparisons are always false — and score_jobs.py relies on resume_score being
// genuinely NULL (not e.g. defaulted to 0) to find unscored work, so that can't change.
// Instead this keeps NULL rows in the result whenever a score range filter is applied.
function applyScoreRangeFilter(
  query: any,
  minScore?: number,
  maxScore?: number,
) {
  if (minScore === undefined && maxScore === undefined) return query;

  const conditions = [
    minScore !== undefined ? `resume_score.gte.${minScore}` : null,
    maxScore !== undefined ? `resume_score.lte.${maxScore}` : null,
  ]
    .filter(Boolean)
    .join(",");

  return query.or(`resume_score.is.null,and(${conditions})`);
}

export async function getTopScoredJobs(
  page: number = 1, // Default to page 1
  pageSize: number = 10, // Default page size
  provider?: string, // Optional provider filter
  minScore: number = 50, // Default minScore
  maxScore: number = 100, // Default maxScore
  isInterested?: boolean | null, // Optional interest filter (true, false, or null for 'not marked')
  searchQuery?: string, // Optional search query
  scoreStage?: "initial" | "custom",
  dateFrom?: string, // Optional posting date range filter (YYYY-MM-DD)
  dateTo?: string,
): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .eq("status", "new")
    .eq("job_state", "new");

  query = applyScoreRangeFilter(query, minScore, maxScore);

  if (provider) {
    query = query.eq("provider", provider);
  }

  if (scoreStage) {
    query = query.eq("resume_score_stage", scoreStage);
  }

  if (isInterested === true) {
    query = query.is("is_interested", true);
  } else if (isInterested === false) {
    query = query.is("is_interested", false);
  } else if (isInterested === null) {
    query = query.is("is_interested", null);
  }

  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  query = applyPostingDateRangeFilter(query, dateFrom, dateTo);

  const { data, error } = await query
    .order("is_interested", { ascending: false, nullsFirst: false })
    .order("resume_score", { ascending: false, nullsFirst: false })
    .order("scraped_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Supabase error (top scored jobs):", error);
    throw new Error(error.message);
  }
  return data ?? [];
}

// New function to get the count of top scored jobs
// Updated to support provider, score, interest, and search filtering
export async function getTopScoredJobsCount(
  provider?: string,
  minScore: number = 50, // Default minScore
  maxScore: number = 100, // Default maxScore
  isInterested?: boolean | null, // Optional interest filter
  searchQuery?: string, // Optional search query
  scoreStage?: "initial" | "custom",
  dateFrom?: string,
  dateTo?: string,
): Promise<number> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact", head: true }) // Select count only
    .eq("is_active", true)
    .eq("status", "new")
    .eq("job_state", "new");

  query = applyScoreRangeFilter(query, minScore, maxScore);

  // Add provider filter if specified
  if (provider) {
    query = query.eq("provider", provider);
  }

  if (scoreStage) {
    query = query.eq("resume_score_stage", scoreStage);
  }

  // Add interest filter if specified
  // undefined means 'all' (no filter on is_interested)
  // null means 'is_interested IS NULL' (not marked)
  // true means 'is_interested IS TRUE'
  // false means 'is_interested IS FALSE'
  if (isInterested === true) {
    query = query.is("is_interested", true);
  } else if (isInterested === false) {
    query = query.is("is_interested", false);
  } else if (isInterested === null) {
    query = query.is("is_interested", null);
  }
  // If isInterested is undefined, no additional filter is applied for interest status.

  // Add search query filter if specified
  if (searchQuery) {
    // Assuming you want to search in 'job_title' and 'company' fields
    // Adjust the fields and logic as per your database schema and search requirements
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    ); // Changed 'role' to 'job_title'
  }

  query = applyPostingDateRangeFilter(query, dateFrom, dateTo);

  const { count, error } = await query;

  if (error) {
    console.error("Supabase count error:", error.message || "Unknown error"); // Added a fallback for empty error message
    throw new Error(error.message || "Failed to get job count"); // Added a fallback for empty error message
  }

  return count ?? 0; // Return the count or 0 if null
}

export async function getNewJobs(
  page: number = 1,
  pageSize: number = 10,
  provider?: string, // Optional provider filter
  minScore?: number,
  maxScore?: number,
  isInterested?: boolean | null, // Optional interest filter (true, false, or null for 'not marked')
  searchQuery?: string, // Optional search query
  scoreStatus?: "pending" | "scored",
  customResumeStatus?: "missing" | "present",
  dateFrom?: string, // Optional posting date range filter (YYYY-MM-DD)
  dateTo?: string,
): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .eq("status", "new") // Filter by status
    .eq("job_state", "new");

  if (scoreStatus === "pending") {
    query = query.is("resume_score", null);
  } else if (scoreStatus === "scored") {
    query = query.not("resume_score", "is", null);
  }

  if (scoreStatus !== "pending") {
    query = applyScoreRangeFilter(query, minScore, maxScore);
  }

  if (customResumeStatus === "missing") {
    query = query.is("customized_resume_id", null);
  } else if (customResumeStatus === "present") {
    query = query.not("customized_resume_id", "is", null);
  }

  // Add provider filter if specified
  if (provider) {
    query = query.eq("provider", provider);
  }

  // Add interest filter if specified
  if (isInterested === true) {
    query = query.is("is_interested", true);
  } else if (isInterested === false) {
    query = query.is("is_interested", false);
  } else if (isInterested === null) {
    query = query.is("is_interested", null);
  } else {
    // Default behavior from original function: is_interested is null or true
    query = query.or("is_interested.is.null,is_interested.eq.true");
  }

  // Add search query filter if specified
  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  query = applyPostingDateRangeFilter(query, dateFrom, dateTo);

  query = query.order("scraped_at", { ascending: false }).range(from, to); // Added pagination

  const response = await query;
  return handleResponse(response);
}

// Function to get the count of all active jobs with filters
export async function getAllActiveJobsCount(
  provider?: string, // Optional provider filter
  minScore?: number,
  maxScore?: number,
  isInterested?: boolean | null, // Optional interest filter
  searchQuery?: string, // Optional search query
  scoreStatus?: "pending" | "scored",
  customResumeStatus?: "missing" | "present",
  dateFrom?: string,
  dateTo?: string,
): Promise<number> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact", head: true }) // Select count only
    .eq("is_active", true)
    .eq("status", "new")
    .eq("job_state", "new");

  if (scoreStatus === "pending") {
    query = query.is("resume_score", null);
  } else if (scoreStatus === "scored") {
    query = query.not("resume_score", "is", null);
  }

  if (scoreStatus !== "pending") {
    query = applyScoreRangeFilter(query, minScore, maxScore);
  }

  if (customResumeStatus === "missing") {
    query = query.is("customized_resume_id", null);
  } else if (customResumeStatus === "present") {
    query = query.not("customized_resume_id", "is", null);
  }

  // Add provider filter if specified
  if (provider) {
    query = query.eq("provider", provider);
  }

  // Add interest filter if specified
  if (isInterested === true) {
    query = query.is("is_interested", true);
  } else if (isInterested === false) {
    query = query.is("is_interested", false);
  } else if (isInterested === null) {
    query = query.is("is_interested", null);
  } else {
    query = query.or("is_interested.is.null,is_interested.eq.true");
  }

  // Add search query filter if specified
  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  query = applyPostingDateRangeFilter(query, dateFrom, dateTo);

  const { count, error } = await query;

  if (error) {
    console.error("Supabase count error (all active jobs):", error);
    throw new Error(error.message); // Or return 0, depending on desired behavior
  }

  return count ?? 0; // Return the count or 0 if null
}

export async function getAppliedJobs(
  page: number = 1,
  pageSize: number = 10,
  provider?: string,
  searchQuery?: string,
  applicationStatus?: string,
  sortBy?: string, // New: sortBy parameter
  sortOrder?: string, // New: sortOrder parameter (e.g., 'asc' or 'desc')
): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();

  const rpcParams: any = {
    p_page_number: page,
    p_page_size: pageSize,
    p_provider: provider || null,
    p_search_query: searchQuery || null,
    p_application_status: applicationStatus || null,
    p_sort_by: sortBy || null, // New: Pass sortBy to RPC params
    p_sort_order: sortOrder || "desc", // New: Pass sortOrder, default to 'desc'
  };

  const response = await supabase.rpc("get_applied_jobs_sorted", rpcParams);

  const data = await handleResponse(response);
  return data ?? [];
}

// Function to get the count of applied jobs
export async function getAppliedJobsCount(
  provider?: string,
  searchQuery?: string,
  applicationStatus?: string, // Add new applicationStatus parameter
): Promise<number> {
  const supabase = await createSupabaseServerClient();
  // IMPORTANT: Ensure these statuses match those in your RPC and database
  // Suggestion: Standardize to ['applied', 'interviewing', 'offered'] if 'offered' is correct
  const appliedStatuses = ["applied", "interviewing", "offer"];

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact", head: true }) // Select count only
    .eq("is_active", true)
    // .in("status", appliedStatuses) // Filter by relevant statuses - replaced by specific status or all applied
    .eq("job_state", "new");

  // Add application status filter if specified
  if (applicationStatus) {
    query = query.eq("status", applicationStatus);
  } else {
    // If no specific status, filter by all relevant applied statuses
    query = query.in("status", appliedStatuses);
  }

  // Add provider filter if specified
  if (provider) {
    query = query.eq("provider", provider);
  }

  // Add search query filter if specified
  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  const { count, error } = await query;

  if (error) {
    console.error("Supabase count error (applied jobs):", error);
    throw new Error(error.message); // Or return 0, depending on desired behavior
  }

  return count ?? 0; // Return the count or 0 if null
}

/**
 * Gets the count of applied jobs on a specific date.
 * @param dateThe date string in 'YYYY-MM-DD' format.
 * @returns A promise that resolves to the number of jobs applied on that date.
 */
export async function getAppliedJobsCountByDate(
  localDateString: string,
): Promise<number> {
  // localDateString is "YYYY-MM-DD", e.g., "2025-05-21" from server's local TZ
  const supabase = await createSupabaseServerClient();
  const appliedStatuses = ["applied", "interviewing", "offer"];

  // Create a Date object representing the start of the local day (00:00:00 local time)
  // For "2025-05-21", this will be 2025-05-21T00:00:00 in the server's local timezone.
  const startOfLocalDay = new Date(localDateString);

  // Convert the start of the local day to a UTC ISO string for the query
  const startOfDayUTCForQuery = startOfLocalDay.toISOString();

  // Create a Date object for the end of the local day
  // Start with the beginning of the local day again
  const endOfLocalDay = new Date(localDateString);
  // Advance it by one full day to get the start of the *next* local day
  endOfLocalDay.setDate(startOfLocalDay.getDate() + 1);

  // Convert the start of the next local day to a UTC ISO string for the query boundary
  const startOfNextDayUTCForQuery = endOfLocalDay.toISOString();

  // For debugging:
  // console.log(`Querying for applications on local date: ${localDateString}`);
  // console.log(`UTC Range: >= ${startOfDayUTCForQuery} and < ${startOfNextDayUTCForQuery}`);

  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .in("status", appliedStatuses)
    .eq("job_state", "new") // Retained this filter if it's still relevant
    .gte("application_date", startOfDayUTCForQuery) // Greater than or equal to the start of the local day (in UTC)
    .lt("application_date", startOfNextDayUTCForQuery); // Less than the start of the next local day (in UTC)

  if (error) {
    console.error(
      `Supabase count error (applied jobs on local date ${localDateString}):`,
      error,
    );
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getJobById(job_id: string): Promise<Job | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, customized_resumes(resume_link)") // Fetches all job fields and the resume_link from the related customized_resume
    .eq("job_id", job_id)
    .single(); // Use single() if you expect only one or zero results

  if (error && error.code !== "PGRST116") {
    // PGRST116: Row not found, which is okay for single()
    console.error("Supabase response error:", error);
    throw new Error(error.message);
  }
  // The 'data' object will now potentially include a 'customized_resumes' field:
  // e.g., { ..., customized_resume_id: 'xyz', customized_resumes: { resume_link: '...' } }
  // or { ..., customized_resume_id: null, customized_resumes: null }
  return data as Job | null; // Ensure your Job type definition accommodates this structure
}

// New function to update a job by its ID
export async function updateJobById(
  job_id: string,
  updates: Partial<Omit<Job, "job_id">>,
): Promise<Job | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("job_id", job_id)
    .select() // Select the updated row
    .single(); // Expect a single row to be returned

  // The handleResponse function might need adjustment if it's not designed for single object returns
  // or if you want specific error handling for updates.
  // For now, we'll adapt the error handling similar to getJobById.
  if (error) {
    // PGRST116: Row not found, which means the job_id didn't match any record.
    if (error.code === "PGRST116") {
      console.warn(`Job with ID ${job_id} not found for update.`);
      return null;
    }
    console.error("Supabase update error:", error);
    throw new Error(error.message);
  }
  return data as Job | null; // Cast to Job or null
}

/**
 * Retrieves a specific customized resume by its ID.
 * @param resume_id The ID of the customized resume to retrieve.
 * @returns A promise that resolves to the Resume object or null if not found.
 */
export async function getCustomizedResumeById(
  resume_id: string,
): Promise<Resume | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customized_resumes") // Target the 'customized_resumes' table
    .select("*")
    .eq("id", resume_id) // Assuming 'id' is the primary key column
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: Row not found, which is okay for single()
    console.error("Supabase error fetching customized resume:", error);
    throw new Error(error.message);
  }
  return data as Resume | null;
}

/**
 * Updates specified fields of a customized resume by its ID.
 * @param resume_id The ID of the customized resume to update.
 * @param updates An object containing the fields to update.
 * @returns A promise that resolves to the updated Resume object or null if not found.
 */
export async function updateCustomizedResumeById(
  resume_id: string,
  updates: Partial<Omit<Resume, "id" | "created_at" | "last_updated">>, // Exclude system-managed fields from direct update via this function
): Promise<Resume | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customized_resumes") // Target the 'customized_resumes' table
    .update(updates)
    .eq("id", resume_id) // Assuming 'id' is the primary key column
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Row not found
      console.warn(
        `Customized resume with ID ${resume_id} not found for update.`,
      );
      return null;
    }
    console.error("Supabase error updating customized resume:", error);
    throw new Error(error.message);
  }
  return data as Resume | null;
}

// New function to upload a personalized resume PDF to Supabase Storage
/**
 * Uploads a personalized resume PDF to Supabase Storage.
 * @param job_id The ID of the job for which the resume is personalized.
 * @param file The PDF file to upload.
 * @returns A promise that resolves to an object containing the public URL of the uploaded file.
 * @throws Will throw an error if the upload fails or the public URL cannot be retrieved.
 */
export async function uploadPersonalizedResume(
  fileName: string,
  file: File,
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const filePath = fileName;

  console.log("Uploading file to path:", filePath);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("personalized_resumes") // Updated bucket name
    .upload(filePath, file, {
      upsert: true, // Overwrite if file already exists
    });

  if (uploadError) {
    console.error("Supabase storage upload error:", uploadError);
    throw new Error(
      `Failed to upload personalized resume: ${uploadError.message}`,
    );
  }

  if (!uploadData || !uploadData.path) {
    console.error(
      "Supabase storage upload error: No path returned despite no error.",
    );
    throw new Error(
      "Failed to upload personalized resume: No path returned from storage.",
    );
  }

  return fileName;
}

/**
 * Retrieves a specific cover letter by its ID.
 */
export async function getCoverLetterById(
  id: string,
): Promise<CoverLetter | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cover_letters")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Supabase error fetching cover letter:", error);
    throw new Error(error.message);
  }
  return data as CoverLetter | null;
}

/**
 * Creates a new cover letter row (content only; the PDF link is attached
 * afterwards once the file is uploaded to storage).
 */
export async function createCoverLetter(
  job_id: string,
  content: string,
): Promise<CoverLetter> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cover_letters")
    .insert({ job_id, content })
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating cover letter:", error);
    throw new Error(error.message);
  }
  return data as CoverLetter;
}

/**
 * Updates a cover letter's content and/or storage link.
 */
export async function updateCoverLetterById(
  id: string,
  updates: Partial<Omit<CoverLetter, "id" | "job_id" | "created_at">>,
): Promise<CoverLetter | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cover_letters")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Supabase error updating cover letter:", error);
    throw new Error(error.message);
  }
  return data as CoverLetter | null;
}

/**
 * Uploads a generated cover letter PDF to the 'personalized_cover_letters'
 * storage bucket. Returns the stored file name (used as the storage path).
 */
export async function uploadCoverLetterPdf(
  fileName: string,
  file: Blob,
): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("personalized_cover_letters")
    .upload(fileName, file, {
      upsert: true,
      contentType: "application/pdf",
    });

  if (uploadError) {
    console.error("Supabase storage upload error:", uploadError);
    throw new Error(`Failed to upload cover letter: ${uploadError.message}`);
  }

  if (!uploadData || !uploadData.path) {
    throw new Error(
      "Failed to upload cover letter: No path returned from storage.",
    );
  }

  return fileName;
}

/**
 * Retrieves the user profile from the 'base_resume' table.
 * Fetches the latest row as per the backend architecture.
 * @returns A promise that resolves to the Resume object or null if not found.
 */
export async function getUserProfileByEmail(): Promise<Resume | null> {
  const supabase = await createSupabaseServerClient();

  // Fetch the latest base resume from the 'base_resume' table
  // This follows the backend's architecture of keeping a single/latest base resume.
  const { data, error } = await supabase
    .from("base_resume")
    .select("resume_data")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // PGRST116: Row not found, which is okay
      console.warn("No base resume found in the 'base_resume' table.");
      return null;
    }
    console.error("Supabase error fetching base resume:", error);
    throw new Error(error.message);
  }

  return (data as any)?.resume_data as Resume | null;
}

/**
 * Updates the base resume data in the 'base_resume' table.
 * Finds the latest row and updates its resume_data JSONB column.
 * @param resumeData The full Resume data object to save.
 * @returns The updated Resume data or null.
 */
export async function updateBaseResume(
  resumeData: Omit<Resume, "id" | "created_at" | "parsed_at" | "last_updated" | "resume_link">,
): Promise<Resume | null> {
  const supabase = await createSupabaseServerClient();

  // First, find the latest base resume row ID
  const { data: existing, error: fetchError } = await supabase
    .from("base_resume")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      console.warn("No base resume found to update.");
      return null;
    }
    console.error("Error fetching base resume for update:", fetchError);
    throw new Error(fetchError.message);
  }

  // Update the resume_data JSONB column
  const { data, error } = await supabase
    .from("base_resume")
    .update({ resume_data: resumeData })
    .eq("id", existing.id)
    .select("resume_data")
    .single();

  if (error) {
    console.error("Error updating base resume:", error);
    throw new Error(error.message);
  }

  return (data as any)?.resume_data as Resume | null;
}

// --- New Count Functions ---

/**
 * Gets the count of expired jobs.
 * @returns A promise that resolves to the number of expired jobs.
 */
export async function getExpiredJobsCount(
  provider?: string,
  minScore?: number,
  maxScore?: number,
  isInterested?: boolean | null,
  searchQuery?: string,
): Promise<number> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("job_state", "expired");

  if (provider) {
    query = query.eq("provider", provider);
  }

  if (isInterested === true) {
    query = query.is("is_interested", true);
  } else if (isInterested === false) {
    query = query.is("is_interested", false);
  } else if (isInterested === null) {
    query = query.is("is_interested", null);
  }

  if (minScore !== undefined) {
    query = query.gte("resume_score", minScore);
  }

  if (maxScore !== undefined) {
    query = query.lte("resume_score", maxScore);
  }

  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  const { count, error } = await query;

  if (error) {
    console.error("Supabase count error (expired jobs):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * Gets expired jobs (job_state is "expired").
 * @returns A promise that resolves to an array of expired jobs.
 */
export async function getExpiredJobs(
  page: number = 1,
  pageSize: number = 10,
  provider?: string,
  minScore?: number,
  maxScore?: number,
  isInterested?: boolean | null,
  searchQuery?: string,
): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("jobs")
    .select("*, customized_resumes(resume_link)")
    .eq("job_state", "expired");

  if (provider) {
    query = query.eq("provider", provider);
  }

  if (isInterested === true) {
    query = query.is("is_interested", true);
  } else if (isInterested === false) {
    query = query.is("is_interested", false);
  } else if (isInterested === null) {
    query = query.is("is_interested", null);
  }

  if (minScore !== undefined) {
    query = query.gte("resume_score", minScore);
  }

  if (maxScore !== undefined) {
    query = query.lte("resume_score", maxScore);
  }

  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  const { data, error } = await query
    .order("last_checked", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Supabase error (expired jobs):", error);
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Gets the count of jobs pending to be scored (resume_score is null).
 * @returns A promise that resolves to the number of jobs pending scoring.
 */
export async function getPendingScoreJobsCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .is("resume_score", null)
    .eq("is_active", true) // Assuming we only count active jobs
    .eq("status", "new") // And new jobs that haven't been processed beyond initial scraping
    .eq("job_state", "new")
    .or("is_interested.is.null,is_interested.eq.true");

  if (error) {
    console.error("Supabase count error (pending score jobs):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * Gets the count of jobs that have already been scored (resume_score is not null).
 * @returns A promise that resolves to the number of scored jobs.
 */
export async function getScoredJobsCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .not("resume_score", "is", null)
    .eq("is_active", true)
    .eq("status", "new")
    .eq("job_state", "new");

  if (error) {
    console.error("Supabase count error (scored jobs):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * Gets the count of jobs which have a custom resume generated (customized_resume_id is not null).
 * @returns A promise that resolves to the number of jobs with a custom resume.
 */
export async function getCustomResumeJobsCount(
  provider?: string,
  minScore?: number,
  maxScore?: number,
  isInterested?: boolean | null,
  searchQuery?: string,
): Promise<number> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .not("customized_resume_id", "is", null)
    .eq("is_active", true);

  if (provider) {
    query = query.eq("provider", provider);
  }

  if (isInterested === true) {
    query = query.is("is_interested", true);
  } else if (isInterested === false) {
    query = query.is("is_interested", false);
  } else if (isInterested === null) {
    query = query.is("is_interested", null);
  }

  if (minScore !== undefined) {
    query = query.gte("resume_score", minScore);
  }

  if (maxScore !== undefined) {
    query = query.lte("resume_score", maxScore);
  }

  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  const { count, error } = await query;

  if (error) {
    console.error("Supabase count error (custom resume jobs):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * Gets jobs which have a custom resume generated (customized_resume_id is not null).
 * @returns A promise that resolves to an array of jobs with a custom resume.
 */
export async function getCustomResumeJobs(
  page: number = 1,
  pageSize: number = 10,
  provider?: string,
  minScore?: number,
  maxScore?: number,
  isInterested?: boolean | null,
  searchQuery?: string,
): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("jobs")
    .select("*, customized_resumes(resume_link)")
    .not("customized_resume_id", "is", null)
    .eq("is_active", true);

  if (provider) {
    query = query.eq("provider", provider);
  }

  if (isInterested === true) {
    query = query.is("is_interested", true);
  } else if (isInterested === false) {
    query = query.is("is_interested", false);
  } else if (isInterested === null) {
    query = query.is("is_interested", null);
  }

  if (minScore !== undefined) {
    query = query.gte("resume_score", minScore);
  }

  if (maxScore !== undefined) {
    query = query.lte("resume_score", maxScore);
  }

  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  const { data, error } = await query
    .order("scraped_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Supabase error (custom resume jobs):", error);
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Gets the count of jobs which have no custom resume (customized_resume_id is null).
 * @returns A promise that resolves to the number of jobs without a custom resume.
 */
export async function getNoCustomResumeJobsCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .is("customized_resume_id", null)
    .eq("is_active", true)
    .eq("status", "new")
    .eq("job_state", "new")
    .or("is_interested.is.null,is_interested.eq.true");

  if (error) {
    console.error("Supabase count error (no custom resume jobs):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * Gets the count of scored jobs based on the original resume.
 * (resume_score is not null AND resume_score_stage is "initial")
 * @returns A promise that resolves to the number of jobs scored with the original resume.
 */
export async function getScoredWithOriginalResumeCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .not("resume_score", "is", null)
    .eq("resume_score_stage", "initial")
    .eq("is_active", true)
    .eq("status", "new")
    .eq("job_state", "new");

  if (error) {
    console.error("Supabase count error (scored with original resume):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * Gets the count of scored jobs based on a custom resume.
 * (resume_score is not null AND resume_score_stage is "custom")
 * @returns A promise that resolves to the number of jobs scored with a custom resume.
 */
export async function getScoredWithCustomResumeCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .not("resume_score", "is", null)
    .eq("resume_score_stage", "custom")
    .eq("is_active", true)
    .eq("status", "new")
    .eq("job_state", "new");

  if (error) {
    console.error("Supabase count error (scored with custom resume):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * Gets the count of jobs from LinkedIn.
 * Filters for active, new status, and new job_state jobs by default.
 * @returns A promise that resolves to the number of LinkedIn jobs.
 */
export async function getLinkedInJobsCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("provider", "linkedin")
    .eq("is_active", true)
    .eq("status", "new")
    .eq("job_state", "new")
    .or("is_interested.is.null,is_interested.eq.true");

  if (error) {
    console.error("Supabase count error (LinkedIn jobs):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * Gets the count of jobs from Careers Future.
 * Filters for active, new status, and new job_state jobs by default.
 * @returns A promise that resolves to the number of Careers Future jobs.
 */
export async function getCareersFutureJobsCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("provider", "careers_future")
    .eq("is_active", true)
    .eq("status", "new")
    .eq("job_state", "new")
    .or("is_interested.is.null,is_interested.eq.true");

  if (error) {
    console.error("Supabase count error (Careers Future jobs):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

// --- Dashboard bucket queries ---
// Buckets slice the pipeline for the dashboard's stat cards / filter row.
// "all" excludes expired jobs (matches the "Total Jobs" card); every other
// non-expired bucket scopes to active, "new" job_state rows.

export type JobBucket =
  | "all"
  | "applied"
  | "in_progress"
  | "not_interested"
  | "rejected"
  | "expired";

function applyBucketFilter(query: any, bucket: JobBucket) {
  switch (bucket) {
    case "applied":
      return query
        .eq("is_active", true)
        .eq("job_state", "new")
        .eq("status", "applied");
    case "in_progress":
      return query
        .eq("is_active", true)
        .eq("job_state", "new")
        .in("status", ["interviewing", "offer"]);
    case "rejected":
      return query
        .eq("is_active", true)
        .eq("job_state", "new")
        .eq("status", "rejected");
    case "not_interested":
      return query
        .eq("is_active", true)
        .eq("job_state", "new")
        .eq("is_interested", false);
    case "expired":
      return query.eq("job_state", "expired");
    case "all":
    default:
      return query.neq("job_state", "expired");
  }
}

export async function getTotalJobsCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .neq("job_state", "expired");

  if (error) {
    console.error("Supabase count error (total jobs):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

// Sorted by resume_score first (best matches surface regardless of when they
// were posted), then by the day-key the UI displays (see formatJobDateOnly)
// as a tiebreaker among same-scoring jobs — fetching a bounded window and
// sorting/paginating in memory since PostgREST can't order by a derived
// date expression.
const BUCKET_SORT_FETCH_CAP = 1000;

export async function getJobsByBucket(
  bucket: JobBucket,
  page: number = 1,
  pageSize: number = 10,
  searchQuery?: string,
  provider?: string,
  minScore?: number,
  maxScore?: number,
  dateFrom?: string,
  dateTo?: string,
  scrapedFrom?: string,
  scrapedTo?: string,
): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = applyBucketFilter(
    supabase.from("jobs").select("*, customized_resumes(resume_link)"),
    bucket,
  );

  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  if (provider) {
    query = query.eq("provider", provider);
  }

  query = applyScoreRangeFilter(query, minScore, maxScore);

  query = applyPostingDateRangeFilter(query, dateFrom, dateTo);

  query = applyScrapedDateRangeFilter(query, scrapedFrom, scrapedTo);

  const { data, error } = await query
    .order("scraped_at", { ascending: false })
    .limit(BUCKET_SORT_FETCH_CAP);

  if (error) {
    console.error("Supabase error (jobs by bucket):", error);
    throw new Error(error.message);
  }

  const jobs = (data ?? []) as Job[];
  jobs.sort((a, b) => {
    const scrapedKeyA = getScrapedDateKey(a);
    const scrapedKeyB = getScrapedDateKey(b);
    if (scrapedKeyA !== scrapedKeyB) {
      return scrapedKeyA < scrapedKeyB ? 1 : -1;
    }
    const scoreA = a.resume_score ?? -1;
    const scoreB = b.resume_score ?? -1;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    const dateKeyA = getJobPostingDateKey(a);
    const dateKeyB = getJobPostingDateKey(b);
    return dateKeyA < dateKeyB ? 1 : dateKeyA > dateKeyB ? -1 : 0;
  });

  return jobs.slice(from, to + 1);
}

export async function getJobsByBucketCount(
  bucket: JobBucket,
  searchQuery?: string,
  provider?: string,
  minScore?: number,
  maxScore?: number,
  dateFrom?: string,
  dateTo?: string,
  scrapedFrom?: string,
  scrapedTo?: string,
): Promise<number> {
  const supabase = await createSupabaseServerClient();
  let query = applyBucketFilter(
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    bucket,
  );

  if (searchQuery) {
    query = query.or(
      `job_title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`,
    );
  }

  if (provider) {
    query = query.eq("provider", provider);
  }

  query = applyScoreRangeFilter(query, minScore, maxScore);

  query = applyPostingDateRangeFilter(query, dateFrom, dateTo);

  query = applyScrapedDateRangeFilter(query, scrapedFrom, scrapedTo);

  const { count, error } = await query;

  if (error) {
    console.error("Supabase count error (jobs by bucket):", error);
    throw new Error(error.message);
  }
  return count ?? 0;
}

/**
 * Job list for the /documents page — a library, not a browser: only jobs
 * that already have a resume and/or cover letter, or are currently
 * generating one (checked via the in-memory generationTracker, since an
 * in-flight job has no doc id yet but still needs to show its progress
 * bar). Same score-then-date sort as getJobsByBucket. No pagination —
 * this list is expected to stay small for a single-user tool.
 */
export async function getJobsForDocuments(
  searchQuery?: string,
): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();

  const inFlightJobIds = Array.from(
    new Set(listInFlightGenerations().map((g) => g.jobId)),
  );

  const orClauses = [
    "customized_resume_id.not.is.null",
    "cover_letter_id.not.is.null",
  ];
  if (inFlightJobIds.length > 0) {
    orClauses.push(`job_id.in.(${inFlightJobIds.join(",")})`);
  }

  // Search is applied in-memory below rather than as a second chained
  // .or() — this list is already small (docs-only), and PostgREST ANDs
  // multiple .or() filters together in a way that's easy to get subtly
  // wrong, so filtering client-side keeps the query itself simple.
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "*, customized_resumes(resume_link), cover_letters(cover_letter_link)",
    )
    .neq("job_state", "expired")
    .or(orClauses.join(","))
    .order("scraped_at", { ascending: false })
    .limit(BUCKET_SORT_FETCH_CAP);

  if (error) {
    console.error("Supabase error (jobs for documents):", error);
    throw new Error(error.message);
  }

  let jobs = (data ?? []) as Job[];

  if (searchQuery) {
    const needle = searchQuery.toLowerCase();
    jobs = jobs.filter(
      (job) =>
        job.job_title?.toLowerCase().includes(needle) ||
        job.company?.toLowerCase().includes(needle),
    );
  }

  jobs.sort((a, b) => {
    const scrapedKeyA = getScrapedDateKey(a);
    const scrapedKeyB = getScrapedDateKey(b);
    if (scrapedKeyA !== scrapedKeyB) {
      return scrapedKeyA < scrapedKeyB ? 1 : -1;
    }
    const scoreA = a.resume_score ?? -1;
    const scoreB = b.resume_score ?? -1;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    const dateKeyA = getJobPostingDateKey(a);
    const dateKeyB = getJobPostingDateKey(b);
    return dateKeyA < dateKeyB ? 1 : dateKeyA > dateKeyB ? -1 : 0;
  });

  return jobs;
}
