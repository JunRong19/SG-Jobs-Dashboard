// Server-only, in-memory tracker for resume/cover-letter generation runs.
// Lets a duplicate request for the same job+type join the run already in
// flight instead of spawning a second one, and lets the /documents page
// show a live "generating" progress bar across page loads/polls.
// In-memory is fine here: this is a single-process personal-use app, not a
// multi-instance deployment.
//
// The Map is pinned to `globalThis` rather than declared as a plain module
// -level const: Next.js compiles each route.ts as its own module bundle, and
// in dev mode two routes that both `import` this file can each end up with
// their own separate module instance — the POST route's Map fills up while
// the GET status route reads a permanently-empty one, and the progress bar
// never shows. globalThis is the one thing guaranteed to be the same object
// across every bundle in a single Node process.

export type GenerationType = "resume" | "cover_letter";

interface TrackedGeneration {
  jobId: string;
  type: GenerationType;
  startedAt: number;
  promise: Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var __generationTracker: Map<string, TrackedGeneration> | undefined;
}

const tracked: Map<string, TrackedGeneration> =
  globalThis.__generationTracker ?? new Map<string, TrackedGeneration>();
globalThis.__generationTracker = tracked;

function key(jobId: string, type: GenerationType) {
  return `${type}:${jobId}`;
}

// Runs `run()` for (jobId, type) unless one is already in flight, in which
// case the existing promise is returned so the caller awaits the same run.
export function getOrStartGeneration(
  jobId: string,
  type: GenerationType,
  run: () => Promise<void>,
): Promise<void> {
  const k = key(jobId, type);
  const existing = tracked.get(k);
  if (existing) return existing.promise;

  const promise = run().finally(() => tracked.delete(k));
  tracked.set(k, { jobId, type, startedAt: Date.now(), promise });
  return promise;
}

export interface InFlightGeneration {
  jobId: string;
  type: GenerationType;
  startedAt: number;
}

export function listInFlightGenerations(): InFlightGeneration[] {
  return Array.from(tracked.values()).map(({ jobId, type, startedAt }) => ({
    jobId,
    type,
    startedAt,
  }));
}

export function isGenerating(jobId: string, type: GenerationType): boolean {
  return tracked.has(key(jobId, type));
}
