# Job Scrapper Web

Job Scrapper Web is a Next.js application designed to help you track and manage job applications scraped using [Job Scraper](https://github.com/anandanair/job-scraper). It allows users to view new job listings, mark jobs as applied, see top matches based on resume scores, and manage customized resumes for different applications.

## Features

- **Dashboard Overview**: View key statistics like new jobs, applied jobs, top matches, and more on the homepage.
- **Job Listings**:
  - **New Jobs**: Browse recently scraped job opportunities.
  - **Applied Jobs**: Keep track of all jobs you've applied to.
  - **Top Matches**: View jobs that best match your profile and resume score.
- **Resume Management**:
  - View and edit customized resumes.
  - Upload and associate personalized resumes with job applications.
  - PDF viewer for resumes.
- **Job Details**: View detailed information for each job, including description and company details.
- **Status Updates**: Mark jobs as "applied" or indicate interest level (interested/not interested).
- **Pagination**: Efficiently navigate through large lists of jobs.
- **Responsive Design**: User-friendly interface across various devices.
- **Supabase Integration**: Utilizes Supabase for backend services and database management.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (v15.3.1)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**:
  - [Lucide React](https://lucide.dev/) for icons
  - [React PDF](https://github.com/wojtekmaj/react-pdf) for PDF viewing
  - [React Markdown](https://github.com/remarkjs/react-markdown) for rendering markdown content
- **Backend/Database**: [Supabase](https://supabase.io/)
- **State Management**: React Hooks (useState, useEffect) and URL search params for component state.
- **Linting**: ESLint (via `next lint`)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Backend Setup (Crucial Prerequisite)

**This frontend application relies on a separate backend for job scraping, scoring, resume generation, and database operations.**

1.  **Backend Repository**: The backend service is located at [Job Scraper](https://github.com/anandanair/job-scraper).
2.  **Fork and Setup**: You **MUST** first fork this backend repository and follow its setup instructions to get the database and backend services running.
3.  **Database**: The backend setup will create and manage the database required by this frontend application.

Once the backend is successfully set up and running, you can proceed with setting up this frontend application.

### Prerequisites

- Node.js (v20 or later recommended)
- npm or yarn
- A running instance of the backend service from [Job Scraper](https://github.com/anandanair/job-scraper).

### Installation

1.  **Clone the repository (if applicable):**

    ```bash
    git clone https://github.com/anandanair/jobs-scrapper-web
    cd jobs-scrapper-web
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of your project and add the necessary Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    ```

### Running the Development Server

Once the dependencies are installed and environment variables are set up, you can run the development server:

```bash
npm run dev
# or
# yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.

## Project Structure

Here's a brief overview of the main directories:

- `public/`: Contains static assets like images and the PDF worker.
- `src/`: Contains the core application code.
  - `src/app/`: Next.js App Router directory.
    - `api/`: API route handlers.
    - `jobs/`: Routes related to job listings (new, applied, top-matches, individual job details, resume views/edits).
    - `profile/`: User profile page (structure suggests this, content not fully reviewed).
    - `layout.tsx`: Root layout for the application.
    - `page.tsx`: Homepage/dashboard.
    - `globals.css`: Global styles and Tailwind CSS setup.
  - `src/components/`: Reusable React components.
    - `jobs/`: Components specific to job listings and details.
    - `resume/`: Components for resume viewing and editing.
    - `CustomPdfViewer.tsx`: Component for displaying PDF files.
    - `Navbar.tsx`: Application navigation bar.
  - `src/lib/`:
    - `supabase/queries.ts`: Functions for interacting with the Supabase database.
  - `src/types.ts`: TypeScript type definitions for the application.
  - `src/utils/`:
    - `supabase/server.ts`: Supabase server client setup.
- `next.config.ts`: Next.js configuration file.
- `package.json`: Lists project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.

## Contributing

Contributions are welcome! Please follow the standard fork-and-pull-request workflow.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
