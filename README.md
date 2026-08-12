# SG Jobs Dashboard

A Next.js dashboard for the [sg-jobs-scraper](https://github.com/JunRong19/SG-Jobs-Scraper) backend pipeline - browse every job it scrapes, track application status and generate a tailored AI resume and cover letter per job.

## Features

#### Frontend
- **Dashboard** - Bucketed views (Total, Applied, In-progress, Not interested, Rejected, Expired) with live counts, plus a "Scraped Today" toggle
- **Search & filtering** - Full-text search plus provider, score-range and posted/scraped date-range filters
- **Documents library** - Every generated resume/cover letter in one place, with an in-browser PDF viewer
- **Profile page** - View and edit your base resume

#### Backend
- **Multi-source scraping** - LinkedIn, MyCareersFuture, JobStreet, and Careers@Gov
- **AI resume-to-job scoring (0–100)** - Match job descriptions against resume to help user prioritize best-fit jobs
- **Tailored resume and cover letters** - AI generate resumes and cover letters for each job application, reducing time spent on application preparation
- **Job lifecycle management** - Auto-expires stale postings and checks whether postings are still active on their source site

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** for storage
- **pdfkit** for server-side PDF generation (resumes + cover letters)
- **react-pdf** for in-browser PDF preview

## Screenshots

<img width="1858" height="958" alt="image" src="https://github.com/user-attachments/assets/63044bfe-deed-41a4-9b45-d0e10f8be5d8" />

<img width="1857" height="571" alt="image" src="https://github.com/user-attachments/assets/eccd8a21-a94d-4950-91a2-45817a7ecf40" />
