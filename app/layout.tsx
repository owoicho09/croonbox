import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

// Deliberately not using next/font/google: it fetches from fonts.gstatic.com
// at build/dev time and fails hard on unreliable networks. The system font
// stack defined in globals.css renders instantly with no external dependency.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const TITLE = "Croonbox — Live AI Interviews for Hiring Teams";
const DESCRIPTION =
  "Croonbox prepares an AI interviewer from your job description, runs a live voice interview with each candidate, and hands your team a recording, transcript, and qualitative report to review.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: TITLE,
    template: "%s · Croonbox",
  },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Croonbox",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
