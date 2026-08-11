import { UserCircle, Target, ListChecks, Mic, MessageCircleQuestion, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type InterviewQuestionPlan = {
  topic: string;
  prompt: string;
  followUpGuidance?: string;
};

export type InterviewConfigView = {
  interviewerRole: string;
  focusAreas: string[];
  questions: InterviewQuestionPlan[];
  tone: string;
  openingLine: string;
  closingLine: string;
  followUpGuidance: string;
  avoidList: string[];
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof UserCircle;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <div className="mt-2 pl-6">{children}</div>
    </div>
  );
}

export function InterviewPreview({ config }: { config: InterviewConfigView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Structure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Section icon={UserCircle} title="Interviewer role">
          <p className="text-sm text-muted-foreground">{config.interviewerRole}</p>
        </Section>

        <Section icon={Target} title="Focus areas">
          <div className="flex flex-wrap gap-1.5">
            {config.focusAreas.map((area) => (
              <Badge key={area} variant="outline">
                {area}
              </Badge>
            ))}
          </div>
        </Section>

        <Section icon={ListChecks} title={`Questions (${config.questions.length})`}>
          <ol className="space-y-3">
            {config.questions.map((q, i) => (
              <li key={i} className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">{q.topic}</p>
                <p className="mt-1 text-sm text-foreground">{q.prompt}</p>
                {q.followUpGuidance && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Follow-up: {q.followUpGuidance}</p>
                )}
              </li>
            ))}
          </ol>
        </Section>

        <Section icon={Mic} title="Tone">
          <p className="text-sm text-muted-foreground">{config.tone}</p>
        </Section>

        <Section icon={MessageCircleQuestion} title="Sample opening">
          <p className="text-sm italic text-muted-foreground">&ldquo;{config.openingLine}&rdquo;</p>
        </Section>

        <Section icon={MessageCircleQuestion} title="Closing">
          <p className="text-sm italic text-muted-foreground">&ldquo;{config.closingLine}&rdquo;</p>
        </Section>

        <Section icon={MessageCircleQuestion} title="Follow-up guidance">
          <p className="text-sm text-muted-foreground">{config.followUpGuidance}</p>
        </Section>

        <Section icon={ShieldAlert} title="What the AI will avoid">
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {config.avoidList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>
      </CardContent>
    </Card>
  );
}
