const steps = [
  {
    number: "01",
    title: "Create Your Job",
    description: "Define the role, add structured interview questions, and set prep and response time limits.",
  },
  {
    number: "02",
    title: "Invite Candidates",
    description: "Send secure interview links via email — one at a time, in bulk, or by importing a CSV.",
  },
  {
    number: "03",
    title: "Candidates Record",
    description: "Candidates complete video interviews asynchronously, at their convenience, from any device.",
  },
  {
    number: "04",
    title: "Review & Decide",
    description: "Watch responses, read transcripts and AI insights, leave notes, and make the call as a team.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How It Works</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Get from job posting to hiring decision in four simple steps.
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.number}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary">
              {step.number}
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
