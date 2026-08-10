import { Video, Brain, ShieldCheck, BarChart3, FileText, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: Video,
    title: "Async Video Interviews",
    description: "Candidates record responses on their own time. No scheduling conflicts, no time zone headaches.",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description:
      "Every response gets a qualitative summary — key evidence, strong signals, and areas worth a follow-up question. No numeric scores.",
  },
  {
    icon: ShieldCheck,
    title: "Structured Evaluation",
    description: "Consistent question sets and evaluation guidance keep every candidate assessment fair and comparable.",
  },
  {
    icon: BarChart3,
    title: "Hiring Activity Analytics",
    description: "Track completion rates and where candidates are in your pipeline, across every open job.",
  },
  {
    icon: FileText,
    title: "Instant Transcripts",
    description: "Every video response is automatically transcribed for quick scanning and searchability.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share candidate reviews, leave notes, and align with your team before making a decision.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything You Need to Hire Better
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          A complete toolkit for hiring teams who value efficiency and fairness.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                <feature.icon className="h-5 w-5" />
              </span>
              <CardTitle className="pt-2">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
