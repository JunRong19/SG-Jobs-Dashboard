import { NextResponse } from "next/server";
import { listInFlightGenerations } from "@/lib/jobs/generationTracker";

// Polled by the /documents page to update progress bars for in-flight
// resume/cover-letter generations without a full page reload.
export async function GET() {
  return NextResponse.json({ inFlight: listInFlightGenerations() });
}
