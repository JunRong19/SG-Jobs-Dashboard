# Job Scraper Web

## Summary

A Next.js dashboard for the [job-scraper](https://github.com/JunRong19/job-scraper) pipeline — browse and triage every job it scrapes, track your application status, and generate a tailored AI resume and cover letter per job, all reading and writing the same Supabase backend the scraper populates.

## Features

- **Dashboard** — bucketed views (Total, Applied, In-progress, Not interested, Rejected, Expired) with live counts, plus a "Scraped Today" toggle
- **Top Matches** — jobs ranked by AI resume-match score, filterable by provider, score range, and interest flag
- **Search & filtering** — full-text search plus provider, score-range, and posted/scraped date-range filters
- **Job detail panel** — full description, source link, status control, and one-click document generation, right next to the list
- **AI resume generation** — personalizes your resume per job and renders it to a pixel-matched PDF (mirrors the Python backend's ReportLab layout, rebuilt in `pdfkit`)
- **AI cover letters** — generates a job-specific cover letter (OpenAI) and exports it to PDF
- **Documents library** — every generated resume/cover letter in one place, with an in-browser PDF viewer
- **Profile page** — view and edit your parsed base resume (skills, experience, education, projects, certifications, languages)
- **In-flight generation tracking** — prevents duplicate resume/cover-letter jobs from being kicked off while one's already running for that job

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Postgres + Storage, `@supabase/ssr`) — shares its schema with the [job-scraper](https://github.com/JunRong19/job-scraper) Python backend
- **pdfkit** for server-side PDF generation (resumes + cover letters)
- **react-pdf** for in-browser PDF preview
- **react-markdown** + **remark-gfm** for job description rendering
- **lucide-react** for icons

## Screenshots

<!-- TODO: add dashboard screenshots to docs/screenshots/ and reference them here -->

## Setup

1. Have the [job-scraper](https://github.com/JunRong19/job-scraper) backend's Supabase schema already set up and populated.
2. Create `.env.local` with your Supabase URL/keys and `OPENAI_API_KEY` (for cover letter generation).
3. `npm install`
4. `npm run dev` — open [http://localhost:3000](http://localhost:3000)
