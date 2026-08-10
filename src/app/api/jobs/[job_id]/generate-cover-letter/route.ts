import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import {
  getJobById,
  getCoverLetterById,
  getUserProfileByEmail,
  createCoverLetter,
  updateCoverLetterById,
  uploadCoverLetterPdf,
  updateJobById,
} from "@/lib/supabase/queries";
import { getOrStartGeneration } from "@/lib/jobs/generationTracker";

const LLM_MODEL = process.env.COVER_LETTER_LLM_MODEL || "gpt-5.4-nano";

// Safety net for the "no em dashes" style rule: the LLM doesn't always follow
// negative style instructions, so strip any that slip through.
function stripEmDashes(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ", ");
}

// --- PDF layout constants (mirrors api/generate-resume for visual consistency) ---
const COLORS = {
  primary: "#1976D2",
  secondary: "#455A64",
  text: "#212121",
};
const MARGIN = 0.75 * 72;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

async function generateCoverLetterText(
  jobTitle: string,
  company: string,
  jobDescription: string,
  candidateName: string,
  candidateSummary: string,
  candidateSkills: string[],
  candidateExperience: { job_title: string; company: string; description: string | null }[],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local to enable cover letter generation.",
    );
  }

  const experienceSummary = candidateExperience
    .slice(0, 3)
    .map(
      (exp) =>
        `- ${exp.job_title} at ${exp.company}${exp.description ? `: ${exp.description}` : ""}`,
    )
    .join("\n");

  const systemPrompt = `You are an expert career writer producing a tailored cover letter.

Rules:
- Use ONLY the candidate facts provided below. Never invent skills, employers, titles, or achievements not present in the input.
- Address the specific job title, company, and key requirements from the job description.
- 3-4 short paragraphs: opening hook, then build a NARRATIVE, not an inventory. Pick 1-2 concrete
  experiences/projects and tell the story of what the candidate did and why it matters for THIS role,
  instead of listing past titles and skills back at the reader. Explain specifically why this role and
  this company (referencing something concrete from the job description), then a closing call to action.
- Do not simply restate resume bullets in prose form. If a sentence could be copy-pasted from the resume
  unchanged, rewrite it to explain the reasoning or impact behind it instead.
- Professional, confident, concise tone, but written the way a real person writes, not a template. Vary
  sentence length; avoid starting every paragraph with the same sentence pattern.
- Never use these words/phrases: "leverage(d)", "spearhead(ed)", "results-oriented", "dynamic", "passionate",
  "proven track record", "synergy", "cutting-edge", "seamlessly", "utilize(d)", "robust", "game-changer",
  "transformative", "thrilled", "excited to apply". Use plain, specific language instead.
- Never use the em dash character (—) or en dash (–) anywhere in your output. Use a period, comma, or "and" instead.
- No markdown, no bullet points, no headers, no placeholders like "[Company Name]"; use the real company name given.
- Do not include a salutation address block (name/date) — start directly with "Dear Hiring Manager," and end with "Sincerely," followed by the candidate's name.
- Output plain text only.`;

  const userPrompt = `CANDIDATE PROFILE
Name: ${candidateName}
Summary: ${candidateSummary || "N/A"}
Skills: ${candidateSkills.join(", ") || "N/A"}
Relevant Experience:
${experienceSummary || "N/A"}

JOB
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

Write the cover letter now.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `LLM request failed (${response.status}): ${errText || response.statusText}`,
    );
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error("LLM returned an empty cover letter.");
  }
  return stripEmDashes(content.trim());
}

function buildCoverLetterPdf(
  candidateName: string,
  candidateEmail: string,
  candidatePhone: string | null,
  jobTitle: string,
  company: string,
  bodyText: string,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const pdfPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // Header: candidate name + contact
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(COLORS.primary)
    .text(candidateName, { width: CONTENT_WIDTH });

  const contactParts = [candidateEmail, candidatePhone].filter(Boolean);
  if (contactParts.length > 0) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.secondary)
      .text(contactParts.join(" | "), { width: CONTENT_WIDTH });
  }

  doc.moveDown(1.5);

  // Date
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.text).text(today);
  doc.moveDown(1);

  // Job/company reference line
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.text)
    .text(`Re: ${jobTitle} at ${company}`, { width: CONTENT_WIDTH });
  doc.moveDown(1.2);

  // Body paragraphs
  const paragraphs = bodyText.split(/\n{2,}|\r\n\r\n/).filter((p) => p.trim());
  doc.font("Helvetica").fontSize(11).fillColor(COLORS.text);
  for (const para of paragraphs) {
    doc.text(para.trim(), { width: CONTENT_WIDTH, align: "justify", lineGap: 3 });
    doc.moveDown(0.8);
  }

  doc.end();
  return pdfPromise;
}

async function runGeneration(job_id: string, job: NonNullable<Awaited<ReturnType<typeof getJobById>>>): Promise<void> {
  const profile = await getUserProfileByEmail();
  if (!profile) {
    throw new Error("No base resume profile found to personalize the cover letter.");
  }

  const bodyText = await generateCoverLetterText(
    job.job_title,
    job.company,
    job.description || "",
    profile.name,
    profile.summary,
    profile.skills || [],
    profile.experience || [],
  );

  const pdfBuffer = await buildCoverLetterPdf(
    profile.name,
    profile.email,
    profile.phone,
    job.job_title,
    job.company,
    bodyText,
  );

  const fileName = `cover_letter_${job_id}.pdf`;
  await uploadCoverLetterPdf(
    fileName,
    new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }),
  );

  let coverLetter;
  if (job.cover_letter_id) {
    coverLetter = await updateCoverLetterById(job.cover_letter_id, {
      content: bodyText,
      cover_letter_link: fileName,
    });
  } else {
    coverLetter = await createCoverLetter(job_id, bodyText);
    coverLetter = await updateCoverLetterById(coverLetter.id, {
      cover_letter_link: fileName,
    });
  }

  if (!coverLetter) {
    throw new Error("Failed to persist generated cover letter.");
  }

  await updateJobById(job_id, { cover_letter_id: coverLetter.id });
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

    const job = await getJobById(job_id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await getOrStartGeneration(job_id, "cover_letter", () =>
      runGeneration(job_id, job),
    );

    const updatedJob = await getJobById(job_id);
    if (!updatedJob?.cover_letter_id) {
      throw new Error("Cover letter generation finished without attaching a letter to this job.");
    }
    const coverLetter = await getCoverLetterById(updatedJob.cover_letter_id);

    return NextResponse.json(
      { job: updatedJob, cover_letter: coverLetter },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error generating cover letter:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to generate cover letter", details: errorMessage },
      { status: 500 },
    );
  }
}
