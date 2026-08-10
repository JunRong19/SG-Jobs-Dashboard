import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Job Application Tracker", // Updated title
  description: "Track and manage job applications scraped from LinkedIn.", // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable}`}
    >
      <body className="antialiased flex flex-col h-screen bg-earth-50 overflow-hidden">
        <TopNav />
        <main className="flex-grow overflow-auto bg-earth-50">
          {children}
        </main>
        <footer className="flex-shrink-0 bg-earth-100 border-t border-earth-200 py-2 text-center text-xs text-earth-600">
          © {new Date().getFullYear()} Job App Tracker
        </footer>
      </body>
    </html>
  );
}
