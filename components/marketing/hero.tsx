import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20">
      <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-4 py-1.5 text-sm font-medium text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        AI-Powered Interview Platform
      </div>

      <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        Hire Smarter with <span className="text-primary">Async Video</span> Interviews
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Let candidates shine on their own time. Get qualitative AI insights, structured
        evaluations, and organized reviews — without scheduling a live call for every
        first-round candidate.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/signup">
            Start Hiring Free <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/#how-it-works">
            <PlayCircle className="h-4 w-4" /> See How It Works
          </Link>
        </Button>
      </div>

      <Card className="mx-auto mt-16 max-w-3xl overflow-hidden text-left">
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
          <span className="ml-2">croonbox.app/dashboard</span>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-6">
          <StatTile label="Active Jobs" value="4" />
          <StatTile label="Candidates This Week" value="17" />
          <StatTile label="Ready for Review" value="6" accent />
        </div>
      </Card>
    </section>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-4 text-left">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
