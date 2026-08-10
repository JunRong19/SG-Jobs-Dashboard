# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single job seeker (personal tool, not multi-tenant). Used during an active job search, primarily on desktop, to manage a high volume of scraped job listings without manually reviewing each one.

## Product Purpose

A personal job search operations tool. It automates the pipeline from discovery to application: scrape jobs from LinkedIn and CareersFuture, score them against a base resume to surface the best matches, generate a tailored resume for each shortlisted role, and track application status through to completion.

The product exists because manually managing this workflow across multiple job boards — reviewing, filtering, customising, and tracking — is too slow and error-prone to do at scale.

## Positioning

The whole pipeline in one place: scrape → AI score → custom resume → track. No competing tool covers all four steps for a personal job search without manual handoffs between separate services.

## Operating Context

- Used solo, no collaboration or sharing requirements.
- Session-based usage: open the dashboard, review new scored jobs, generate resumes for top matches, mark applications, then close.
- Jobs arrive via scraping (external workflow); this app is the review and action surface, not the scraper itself.
- Job sources: LinkedIn, CareersFuture (Singapore).
- Resume data is stored in Supabase; custom resumes are generated via an API route and stored in Supabase Storage.

## Capabilities and Constraints

- Job states: new (active), applied, expired.
- Scoring: jobs are scored against a base resume (initial score) or a custom resume (custom score). Scoring is async; "pending scoring" is a real UI state.
- Custom resumes: generated per job, tracked as present or absent per listing.
- Filters: by score, source platform, custom resume status, application status.
- Authentication: single user identified by email via Supabase.
- Stack: Next.js (App Router), Supabase (Postgres + Storage), Tailwind CSS v4, TypeScript.
- No multi-user, no public-facing pages, no marketing surface.

## Brand Commitments

Product name is undecided — this is a personal utility. "JobTrack" appears in the UI navbar; treat it as a working label, not a committed brand. No logo, no external brand assets.

## Evidence on Hand

- Full incumbent implementation exists (Next.js app with all routes and components).
- Design system is defined in `src/app/globals.css`: earth/clay/sage warm palette, Geist Sans + Geist Mono fonts.
- No real testimonials, marketing copy, or external brand assets exist or should be fabricated.

## Product Principles

1. **Pipeline completeness over feature breadth.** The value is the end-to-end workflow. Every surface should move the user closer to a submitted application.
2. **Signal over noise.** Scoring and filtering exist to shrink the decision surface. UI should reinforce this — show what matters, hide what doesn't.
3. **Personal-scale trust.** This is a solo tool. Confirm destructive actions, but don't add friction designed for teams or public users.
4. **Warm utility.** The earth/clay/sage palette is intentional — the tool should feel calm and focused, not corporate or anxious.
5. **Async-aware.** Scoring and generation take time. The UI must handle pending, processing, and error states as first-class citizens.
