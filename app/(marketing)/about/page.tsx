import type { Metadata } from "next";
import { ShieldCheck, Clock, Globe2, Scale } from "lucide-react";

export const metadata: Metadata = { title: "About" };

const values = [
  {
    icon: ShieldCheck,
    title: "Fairness First",
    description: "Structured interviews reduce bias and give every candidate an equal opportunity to shine.",
  },
  {
    icon: Clock,
    title: "Candidate Experience",
    description: "Candidates start their live interview whenever works for them — no scheduling back-and-forth.",
  },
  {
    icon: Globe2,
    title: "Global Access",
    description: "No time zone barriers. Interview candidates anywhere in the world, on their own schedule.",
  },
  {
    icon: Scale,
    title: "Human Decisions, AI-Assisted",
    description: "AI insights surface evidence and signals — the hiring team always makes the final call.",
  },
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Building a Fairer First Round</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Croonbox brings structure and AI-assisted review together so hiring teams can run consistent
        first-round interviews without coordinating a human interviewer&rsquo;s calendar for every candidate.
      </p>

      <div className="mt-16 grid gap-8 sm:grid-cols-2">
        {values.map((value) => (
          <div key={value.title}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <value.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-foreground">{value.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
