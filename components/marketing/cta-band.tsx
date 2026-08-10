import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-8 sm:py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">Ready to Transform Your Hiring?</h2>
        <p className="mx-auto mt-4 max-w-xl text-blue-100">
          Start with a free plan — publish your first job and invite candidates in minutes.
        </p>
        <Button asChild size="lg" variant="secondary" className="mt-8">
          <Link href="/signup">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
