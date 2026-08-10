const pillars = [
  {
    title: "No scheduling back-and-forth",
    description: "Candidates record on their own time — no calendar tetris across time zones.",
  },
  {
    title: "Every candidate, same questions",
    description: "Structured prompts and evaluation guidance keep first-round interviews consistent.",
  },
  {
    title: "AI assists, humans decide",
    description: "Qualitative insights surface evidence and signals — your team makes the call.",
  },
];

export function ValueStrip() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6 sm:py-14">
        {pillars.map((pillar) => (
          <div key={pillar.title}>
            <h3 className="text-lg font-semibold">{pillar.title}</h3>
            <p className="mt-2 text-sm text-blue-100">{pillar.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
