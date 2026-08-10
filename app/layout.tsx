import type { Metadata } from "next";
import "./globals.css";

// Deliberately not using next/font/google: it fetches from fonts.gstatic.com
// at build/dev time and fails hard on unreliable networks. The system font
// stack defined in globals.css renders instantly with no external dependency.
export const metadata: Metadata = {
  title: {
    default: "Croonbox — Async Video Interviews for Hiring Teams",
    template: "%s · Croonbox",
  },
  description:
    "Structured, asynchronous video interviews with qualitative AI insights. Hire without scheduling a live call for every candidate.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
