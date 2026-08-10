import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
      <p className="mt-6 text-muted-foreground">
        This page will hold Croonbox&apos;s terms of service. Contact hello@croonbox.app with any
        questions.
      </p>
    </section>
  );
}
