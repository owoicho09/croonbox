import { Trash2 } from "lucide-react";
import { deleteQuestionAction } from "@/lib/actions/jobs";
import { Card, CardContent } from "@/components/ui/card";

type Question = {
  id: string;
  orderIndex: number;
  prompt: string;
  prepSeconds: number | null;
  responseSeconds: number | null;
  evaluationGuidance: string | null;
};

export function QuestionList({ jobId, questions }: { jobId: string; questions: Question[] }) {
  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions yet — add your first one below.</p>;
  }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="flex items-start justify-between gap-4 py-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Question {i + 1}</p>
              <p className="mt-1 text-sm text-foreground">{q.prompt}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {q.prepSeconds ? `${q.prepSeconds}s prep` : "Default prep"} ·{" "}
                {q.responseSeconds ? `${q.responseSeconds}s response` : "Default response limit"}
              </p>
              {q.evaluationGuidance && (
                <p className="mt-2 rounded-md bg-secondary px-2 py-1.5 text-xs text-muted-foreground">
                  Evaluation guidance: {q.evaluationGuidance}
                </p>
              )}
            </div>
            <form action={deleteQuestionAction.bind(null, jobId, q.id)}>
              <button
                type="submit"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                aria-label="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
