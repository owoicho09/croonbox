import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-6 text-muted-foreground">
        This page will hold Croonbox&apos;s privacy policy. Contact hello@croonbox.app with any
        questions about how candidate and employer data is handled.
      </p>
    </section>
  );
}
