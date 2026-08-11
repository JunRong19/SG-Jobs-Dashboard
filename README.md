# Job Scraper Web

## Summary

A Next.js dashboard for the [job-scraper](https://github.com/JunRong19/job-scraper) pipeline - browse every job it scrapes, track your application status and generate a tailored AI resume and cover letter per job.

## Features

- **Dashboard** — Bucketed views (Total, Applied, In-progress, Not interested, Rejected, Expired) with live counts, plus a "Scraped Today" toggle
- **Search & filtering** - Full-text search plus provider, score-range and posted/scraped date-range filters
- **Documents library** - Every generated resume/cover letter in one place, with an in-browser PDF viewer
- **Profile page** - View and edit your base resume

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Postgres + Storage, `@supabase/ssr`) — shares its schema with the [job-scraper](https://github.com/JunRong19/job-scraper) Python backend
- **pdfkit** for server-side PDF generation (resumes + cover letters)
- **react-pdf** for in-browser PDF preview
- **react-markdown** + **remark-gfm** for job description rendering
- **lucide-react** for icons

## Screenshots

<img width="1858" height="958" alt="image" src="https://github.com/user-attachments/assets/63044bfe-deed-41a4-9b45-d0e10f8be5d8" />

<img width="1857" height="571" alt="image" src="https://github.com/user-attachments/assets/eccd8a21-a94d-4950-91a2-45817a7ecf40" />
