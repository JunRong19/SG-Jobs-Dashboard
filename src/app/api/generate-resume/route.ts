import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { Resume } from "@/types";

// The API receives a resume data object without technical metadata fields
type ResumeInput = Omit<Resume, "id" | "created_at" | "parsed_at" | "last_updated" | "resume_link">;

// --- Color palette (matched by sampling the real resume.pdf directly; matches Python script) ---
const COLORS = {
  primary: "#365F91", // Section heading blue (measured)
  secondary: "#455A64", // Dark blue-gray
  text: "#212121", // Near black
  light: "#757575", // Medium gray
  hrLine: "#000000", // Section rule (measured: pure black)
  link: "#0000FF", // Hyperlink text (measured: pure blue)
};

// --- Page constants (matches Python: letter, 0.6" margins) ---
const MARGIN = 0.6 * 72; // 0.6 inches in points
const PAGE_WIDTH = 612; // Letter width in points
const PAGE_HEIGHT = 792; // Letter height in points
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// --- Abbreviation-safe sentence splitter (matches Python) ---
const ABBREVIATIONS: Record<string, string> = {
  "e.g.": "TEMP_EG",
  "i.e.": "TEMP_IE",
  "etc.": "TEMP_ETC",
  "vs.": "TEMP_VS",
  "Mr.": "TEMP_MR",
  "Mrs.": "TEMP_MRS",
  "Ms.": "TEMP_MS",
  "Dr.": "TEMP_DR",
  "St.": "TEMP_ST",
  "Ph.D.": "TEMP_PHD",
  "U.S.": "TEMP_US",
  "U.K.": "TEMP_UK",
};

function protectAbbreviations(text: string): string {
  let result = text;
  for (const [abbr, placeholder] of Object.entries(ABBREVIATIONS)) {
    result = result.replaceAll(abbr, placeholder);
  }
  return result;
}

function restoreAbbreviations(text: string): string {
  let result = text;
  for (const [abbr, placeholder] of Object.entries(ABBREVIATIONS)) {
    result = result.replaceAll(placeholder, abbr);
  }
  return result;
}

function splitIntoSentences(text: string): string[] {
  const protectedText = protectAbbreviations(text.trim());
  const rawSentences = protectedText.split(". ");

  const sentences: string[] = [];
  for (let i = 0; i < rawSentences.length; i++) {
    let sentence = rawSentences[i];
    if (!sentence) continue;
    sentence = restoreAbbreviations(sentence);

    // Add period back if not the last sentence, or if the last sentence doesn't end with punctuation
    if (
      i < rawSentences.length - 1 ||
      ![".", "!", "?"].includes(sentence[sentence.length - 1])
    ) {
      sentence = sentence + ".";
    }

    sentences.push(sentence.trim());
  }
  return sentences;
}

function isNA(value: string | null | undefined): boolean {
  return !value || value === "NA";
}

// --- Duration helper (mirrors Python's _format_duration) ---
const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseDateToken(token: string | null | undefined): { year: number; month: number } | null {
  if (!token) return null;
  const t = token.trim();
  if (["NA", "PRESENT", "CURRENT", "ONGOING"].includes(t.toUpperCase())) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  if (/^\d{4}$/.test(t)) {
    // Year-only granularity: treat as January so whole-year spans compute cleanly.
    return { year: parseInt(t, 10), month: 1 };
  }
  const monYYYY = t.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monYYYY) {
    const idx = MONTH_NAMES.indexOf(monYYYY[1].slice(0, 3).toLowerCase());
    if (idx >= 0) return { year: parseInt(monYYYY[2], 10), month: idx + 1 };
  }
  const mmYYYY = t.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYYYY) return { year: parseInt(mmYYYY[2], 10), month: parseInt(mmYYYY[1], 10) };
  const yyyyMM = t.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyyMM) return { year: parseInt(yyyyMM[1], 10), month: parseInt(yyyyMM[2], 10) };
  return null;
}

function formatDuration(startDate: string | null | undefined, endDate: string | null | undefined): string {
  const start = parseDateToken(startDate);
  const end = parseDateToken(endDate);
  if (!start || !end) return "";

  let totalMonths = (end.year - start.year) * 12 + (end.month - start.month);
  if (totalMonths <= 0) totalMonths = 1;

  if (totalMonths < 12) {
    return `${totalMonths} Month${totalMonths !== 1 ? "s" : ""}`;
  }
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  let duration = `${years} Year${years !== 1 ? "s" : ""}`;
  if (months) duration += ` ${months} Month${months !== 1 ? "s" : ""}`;
  return duration;
}

// --- Helper: Check if we need a new page ---
function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number) {
  if (doc.y + neededHeight > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
  }
}

// --- Section heading with horizontal rule ---
function drawSectionHeading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 30);
  doc.moveDown(0.35);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.primary)
    .text(title, MARGIN, doc.y, { width: CONTENT_WIDTH });

  // Horizontal rule below heading (matches Python HRFlowable)
  const ruleY = doc.y + 2;
  doc
    .moveTo(MARGIN, ruleY)
    .lineTo(PAGE_WIDTH - MARGIN, ruleY)
    .strokeColor(COLORS.hrLine)
    .lineWidth(1)
    .stroke();
  doc.y = ruleY + 5;
}

// --- Bullet point text, with **bold** markdown spans rendered bold ---
// Hanging indent: the "▪" marker sits at bulletX, all lines of the wrapped
// text (including the first) start at textX, matching the real resume.pdf.
const BULLET_X = MARGIN + 10;
const BULLET_TEXT_X = MARGIN + 24;

function drawBullet(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 16);
  const startY = doc.y;

  doc.font("Helvetica").fontSize(8).fillColor(COLORS.text);
  doc.text("▪", BULLET_X, startY, { continued: false, lineBreak: false });

  const segments = text.split(/(\*\*.+?\*\*)/g).filter((s) => s.length > 0);
  if (segments.length === 0) segments.push(text);

  doc.fontSize(10).fillColor(COLORS.text);
  segments.forEach((seg, i) => {
    const isBold = seg.startsWith("**") && seg.endsWith("**") && seg.length > 3;
    const content = isBold ? seg.slice(2, -2) : seg;
    const isLast = i === segments.length - 1;

    doc.font(isBold ? "Helvetica-Bold" : "Helvetica");
    if (i === 0) {
      doc.text(content, BULLET_TEXT_X, startY, {
        width: CONTENT_WIDTH - (BULLET_TEXT_X - MARGIN),
        lineGap: 2,
        continued: !isLast,
      });
    } else {
      doc.text(content, { continued: !isLast });
    }
  });
  doc.y += 2; // spaceAfter matching Python's 4pt (approx)
}

// --- Description handler: bullets from newlines or sentence splitting ---
function drawDescription(doc: PDFKit.PDFDocument, description: string) {
  if (description.includes("\n")) {
    const bullets = description.split("\n");
    for (const bullet of bullets) {
      const trimmed = bullet.trim();
      if (!trimmed) continue;
      let bulletText = trimmed;
      if (bulletText.startsWith("-")) {
        bulletText = bulletText.substring(1).trim();
      } else if (bulletText.startsWith("•")) {
        bulletText = bulletText.substring(1).trim();
      }
      drawBullet(doc, bulletText);
    }
  } else {
    const sentences = splitIntoSentences(description);
    for (const sentence of sentences) {
      if (sentence) {
        drawBullet(doc, sentence);
      }
    }
  }
}

// --- Two-column row (left text + right-aligned text) ---
function drawTwoColumnRow(
  doc: PDFKit.PDFDocument,
  leftText: string,
  leftFont: string,
  leftSize: number,
  leftColor: string,
  rightText: string,
  rightFont: string,
  rightSize: number,
  rightColor: string,
  leftWidth: number,
  rightWidth: number
) {
  ensureSpace(doc, 20);
  const startY = doc.y;

  doc.font(leftFont).fontSize(leftSize).fillColor(leftColor);
  doc.text(leftText, MARGIN, startY, {
    width: leftWidth,
    continued: false,
  });

  const leftEndY = doc.y;

  doc.font(rightFont).fontSize(rightSize).fillColor(rightColor);
  doc.text(rightText, MARGIN + leftWidth, startY, {
    width: rightWidth,
    align: "right",
  });

  const rightEndY = doc.y;
  doc.y = Math.max(leftEndY, rightEndY);
}

// --- Centered tagline: plain segments + clickable link segments, joined by " | " ---
function drawCenteredTagline(doc: PDFKit.PDFDocument, parts: { text: string; link?: string }[]) {
  if (parts.length === 0) return;
  doc.fontSize(10);
  const sepWidth = doc.widthOfString(" | ");
  const widths = parts.map((p) => doc.widthOfString(p.text));
  const totalWidth = widths.reduce((a, b) => a + b, 0) + sepWidth * (parts.length - 1);

  let x = MARGIN + Math.max(0, (CONTENT_WIDTH - totalWidth) / 2);
  const lineY = doc.y;

  parts.forEach((p, i) => {
    doc.font("Helvetica").fillColor(p.link ? COLORS.link : COLORS.secondary);
    doc.text(p.text, x, lineY, { link: p.link, underline: !!p.link, continued: false });
    x += widths[i];
    if (i < parts.length - 1) {
      doc.fillColor(COLORS.secondary).text(" | ", x, lineY, { continued: false });
      x += sepWidth;
    }
  });
  doc.y = lineY + 13;
}

export async function POST(request: NextRequest) {
  try {
    const resumeData: ResumeInput = await request.json();

    const doc = new PDFDocument({
      size: "LETTER",
      margins: {
        top: MARGIN,
        bottom: MARGIN,
        left: MARGIN,
        right: MARGIN,
      },
      autoFirstPage: true,
      bufferPages: true,
    });

    // Collect PDF bytes into a buffer
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    // ===== HEADER: Name (centered, serif) =====
    if (resumeData.name) {
      doc
        .font("Times-Bold")
        .fontSize(24)
        .fillColor(COLORS.text)
        .text(resumeData.name, MARGIN, MARGIN, {
          width: CONTENT_WIDTH,
          align: "center",
        });
      doc.y += 10;
    }

    // ===== TAGLINE: title | phone | email | location | links (centered, one line) =====
    const taglineParts: { text: string; link?: string }[] = [];
    if (!isNA(resumeData.title)) taglineParts.push({ text: resumeData.title! });
    if (!isNA(resumeData.phone)) taglineParts.push({ text: resumeData.phone });
    if (!isNA(resumeData.email)) taglineParts.push({ text: resumeData.email });
    if (!isNA(resumeData.location)) taglineParts.push({ text: resumeData.location });

    if (resumeData.links) {
      if (!isNA(resumeData.links.linkedin)) {
        const url = resumeData.links.linkedin!.startsWith("http")
          ? resumeData.links.linkedin!
          : `https://${resumeData.links.linkedin}`;
        taglineParts.push({ text: "LinkedIn", link: url });
      }
      if (!isNA(resumeData.links.github)) {
        const url = resumeData.links.github!.startsWith("http")
          ? resumeData.links.github!
          : `https://${resumeData.links.github}`;
        taglineParts.push({ text: "GitHub", link: url });
      }
      if (!isNA(resumeData.links.portfolio)) {
        const url = resumeData.links.portfolio!.startsWith("http")
          ? resumeData.links.portfolio!
          : `https://${resumeData.links.portfolio}`;
        taglineParts.push({ text: "Portfolio", link: url });
      }
    }

    drawCenteredTagline(doc, taglineParts);
    doc.y += 2;

    // ===== SKILLS (categorized if available, else 3-column flat grid) =====
    const skillCategories = (resumeData.skill_categories || []).filter(
      (cat) => !isNA(cat.label) && cat.skills && cat.skills.length > 0
    );

    if (skillCategories.length > 0) {
      drawSectionHeading(doc, "SKILLS");
      for (const cat of skillCategories) {
        const skillsStr = cat.skills.filter((s) => s !== "NA").join(", ");
        if (!skillsStr) continue;
        ensureSpace(doc, 16);
        const startY = doc.y;
        doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.text);
        const labelText = `${cat.label.replace(/:\s*$/, "")}: `;
        doc.text(labelText, MARGIN, startY, { continued: true, width: CONTENT_WIDTH });
        doc.font("Helvetica").text(skillsStr, { continued: false });
        doc.y += 3;
      }
      doc.y += 0.05 * 72;
    } else if (resumeData.skills && resumeData.skills.length > 0) {
      const seenSkills = new Set<string>();
      const skillsList = resumeData.skills.filter((s) => {
        if (s === "NA") return false;
        const key = s.trim().toLowerCase();
        if (seenSkills.has(key)) return false;
        seenSkills.add(key);
        return true;
      });

      if (skillsList.length > 0) {
        drawSectionHeading(doc, "SKILLS");

        const numColumns = 3;
        const colWidth = CONTENT_WIDTH / numColumns;
        const rows = Math.ceil(skillsList.length / numColumns);

        for (let i = 0; i < rows; i++) {
          ensureSpace(doc, 16);
          const rowY = doc.y;
          let maxHeight = 0;

          for (let j = 0; j < numColumns; j++) {
            const skillIndex = i * numColumns + j;
            if (skillIndex < skillsList.length) {
              const skillText = `• ${skillsList[skillIndex]}`;
              const colX = MARGIN + j * colWidth + (j === 0 ? 10 : 0);
              const adjustedWidth = colWidth - (j === 0 ? 10 : 0) - 6;

              doc
                .font("Helvetica")
                .fontSize(10)
                .fillColor(COLORS.text)
                .text(skillText, colX, rowY, {
                  width: adjustedWidth,
                  lineGap: 2,
                });

              const cellHeight = doc.y - rowY;
              if (cellHeight > maxHeight) maxHeight = cellHeight;
            }
          }
          doc.y = rowY + maxHeight + 3; // 3pt bottom padding per row
        }

        doc.y += 0.05 * 72; // Spacer(1, 0.05*inch)
      }
    }

    // ===== PROFESSIONAL EXPERIENCE =====
    if (resumeData.experience && resumeData.experience.length > 0) {
      drawSectionHeading(doc, "PROFESSIONAL EXPERIENCE");

      for (const exp of resumeData.experience) {
        // Line 1: Company (bold)
        if (!isNA(exp.company)) {
          ensureSpace(doc, 16);
          doc
            .font("Helvetica-Bold")
            .fontSize(11)
            .fillColor(COLORS.text)
            .text(exp.company!, MARGIN, doc.y, { width: CONTENT_WIDTH });
          doc.y += 1;
        }

        // Line 2: Job title (italic) + computed duration.
        // Skip if the title already ends with a "(...)" duration (older resume data
        // sometimes has this baked into the title from the original resume text).
        let roleText = isNA(exp.job_title) ? "" : exp.job_title!;
        const duration = formatDuration(exp.start_date, exp.end_date);
        if (roleText && duration && !/\([^)]*\)\s*$/.test(roleText)) {
          roleText = `${roleText} (${duration})`;
        }
        if (roleText) {
          ensureSpace(doc, 14);
          doc
            .font("Helvetica-Oblique")
            .fontSize(10)
            .fillColor(COLORS.text)
            .text(roleText, MARGIN, doc.y, { width: CONTENT_WIDTH });
          doc.y += 2;
        }

        // Line 3: Location (left) | Dates (right)
        const locationText = isNA(exp.location) ? "" : exp.location!;
        let dates = "";
        if (!isNA(exp.start_date) && !isNA(exp.end_date)) {
          dates = `${exp.start_date} - ${exp.end_date}`;
        } else if (!isNA(exp.start_date)) {
          dates = `${exp.start_date} - Present`;
        }

        if (locationText || dates) {
          const leftWidth = 4.636 * 72;
          const rightWidth = CONTENT_WIDTH - leftWidth;
          drawTwoColumnRow(
            doc,
            locationText,
            "Helvetica",
            9.5,
            COLORS.secondary,
            dates,
            "Helvetica-Oblique",
            9,
            COLORS.light,
            leftWidth,
            rightWidth
          );
        }
        doc.y += 0.08 * 72;

        // Description bullets
        if (!isNA(exp.description)) {
          drawDescription(doc, exp.description!);
        }

        doc.y += 0.08 * 72;
      }
    }

    // ===== PROJECTS =====
    if (resumeData.projects && resumeData.projects.length > 0) {
      drawSectionHeading(doc, "PROJECTS");

      for (const proj of resumeData.projects) {
        // Project name
        if (!isNA(proj.name)) {
          ensureSpace(doc, 20);
          doc
            .font("Helvetica-Bold")
            .fontSize(12)
            .fillColor(COLORS.primary)
            .text(proj.name, MARGIN, doc.y, { width: CONTENT_WIDTH });
          doc.y += 4;
        }

        // Technologies (directly under the project name, matching the real resume layout)
        if (
          proj.technologies &&
          proj.technologies.length > 0 &&
          !(proj.technologies.length === 1 && proj.technologies[0] === "NA")
        ) {
          const techList = proj.technologies.filter((t) => t !== "NA");
          if (techList.length > 0) {
            ensureSpace(doc, 16);
            doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.light);
            doc.text(`Technologies: ${techList.join(", ")}`, MARGIN, doc.y, {
              width: CONTENT_WIDTH,
            });
            doc.y += 4;
          }
        }

        // Description bullets
        if (!isNA(proj.description)) {
          drawDescription(doc, proj.description!);
        }

        doc.y += 0.08 * 72;
      }
    }

    // ===== EDUCATION (kept last, after Skills/Experience/Projects) =====
    if (resumeData.education && resumeData.education.length > 0) {
      drawSectionHeading(doc, "EDUCATION");

      for (const edu of resumeData.education) {
        // Degree info
        let degreeInfo = isNA(edu.degree) ? "" : edu.degree;
        if (!isNA(edu.field_of_study)) {
          degreeInfo += `, ${edu.field_of_study}`;
        }

        // Years
        let years = "";
        if (!isNA(edu.start_year) && !isNA(edu.end_year)) {
          years = `${edu.start_year} - ${edu.end_year}`;
        } else if (!isNA(edu.start_year)) {
          years = `Started ${edu.start_year}`;
        } else if (!isNA(edu.end_year)) {
          years = `Graduated ${edu.end_year}`;
        }

        // Python: colWidths=[5.15*inch, 2*inch]
        const leftWidth = 5.15 * 72;
        const rightWidth = CONTENT_WIDTH - leftWidth;

        // Degree is bold in Python (<b> tags), use Helvetica-Bold
        drawTwoColumnRow(
          doc,
          degreeInfo,
          "Helvetica-Bold",
          10,
          COLORS.text,
          years,
          "Helvetica-Oblique",
          9,
          COLORS.light,
          leftWidth,
          rightWidth
        );

        // Institution
        if (!isNA(edu.institution)) {
          doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor(COLORS.text)
            .text(edu.institution!, MARGIN, doc.y, { width: CONTENT_WIDTH });
        }

        doc.y += 0.08 * 72;
      }
    }

    // ===== CERTIFICATIONS =====
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      drawSectionHeading(doc, "CERTIFICATIONS");

      for (const cert of resumeData.certifications) {
        if (isNA(cert.name) && isNA(cert.issuer)) continue;

        const certName = isNA(cert.name) ? "" : cert.name;
        const yearText = isNA(cert.year) ? "" : cert.year!;

        // Python: colWidths=[5.3*inch, 2*inch]
        const leftWidth = 5.3 * 72;
        const rightWidth = CONTENT_WIDTH - leftWidth;

        drawTwoColumnRow(
          doc,
          certName,
          "Helvetica-Bold",
          10,
          COLORS.text,
          yearText,
          "Helvetica-Oblique",
          9,
          COLORS.light,
          leftWidth,
          rightWidth
        );

        // Issuer
        if (!isNA(cert.issuer)) {
          doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor(COLORS.text)
            .text(cert.issuer!, MARGIN, doc.y, { width: CONTENT_WIDTH });
        }

        doc.y += 0.06 * 72;
      }
    }

    // ===== LANGUAGES =====
    if (resumeData.languages && resumeData.languages.length > 0) {
      const langList = resumeData.languages.filter((l) => l !== "NA");
      if (langList.length > 0) {
        drawSectionHeading(doc, "LANGUAGES");
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(COLORS.text)
          .text(langList.join(", "), MARGIN, doc.y, { width: CONTENT_WIDTH });
      }
    }

    // Finalize the PDF
    doc.end();
    const pdfBuffer = await pdfPromise;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=resume.pdf",
      },
    });
  } catch (error) {
    console.error("Error generating resume PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
