import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, aiInterviewConfigs, candidateInvitations, candidates, interviewSessions, activityLog } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { updateJobDetailsAction } from "@/lib/actions/jobs";
import { JobDetailsForm } from "@/components/jobs/job-details-form";
import { GenerateInterviewPanel } from "@/components/jobs/generate-interview-panel";
import { PublishBar } from "@/components/jobs/publish-bar";
import { InvitePanel } from "@/components/candidates/invite-panel";
import { CandidatePipeline } from "@/components/candidates/candidate-pipeline";
import { CopyLinkButton } from "@/components/jobs/copy-link-button";
import { PreviewInterviewButton } from "@/components/jobs/preview-interview-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

function toDatetimeLocal(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { jobId } = await params;
  const { tab } = await searchParams;
  const { organization } = await requireOrgContext();

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)))
    .limit(1);

  if (!job) notFound();

  const [config] = await db.select().from(aiInterviewConfigs).where(eq(aiInterviewConfigs.jobId, jobId)).limit(1);

  const candidateRows = await db
    .select({
      sessionId: interviewSessions.id,
      candidateName: candidates.name,
      candidateEmail: candidates.email,
      status: interviewSessions.status,
      decision: interviewSessions.decision,
      invitedAt: candidateInvitations.createdAt,
    })
    .from(candidateInvitations)
    .innerJoin(candidates, eq(candidateInvitations.candidateId, candidates.id))
    .innerJoin(interviewSessions, eq(interviewSessions.invitationId, candidateInvitations.id))
    .where(and(eq(candidateInvitations.jobId, jobId), eq(candidates.isPreview, false)))
    .orderBy(desc(candidateInvitations.createdAt));

  const completedCount = candidateRows.filter((r) =>
    ["completed", "processing", "ready_for_review", "reviewed"].includes(r.status),
  ).length;
  const reportsReadyCount = candidateRows.filter((r) => ["ready_for_review", "reviewed"].includes(r.status)).length;

  const recentActivity = await db
    .select()
    .from(activityLog)
    .where(and(eq(activityLog.organizationId, organization.id), eq(activityLog.entityId, jobId)))
    .orderBy(desc(activityLog.createdAt))
    .limit(10);

  const updateAction = updateJobDetailsAction.bind(null, jobId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const jobUrl = `${appUrl}/jobs/${job.id}`;
  const subtitle = [job.department, job.location, job.employmentType ? EMPLOYMENT_TYPE_LABEL[job.employmentType] : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
            <Badge variant={job.status === "published" ? "success" : job.status === "closed" ? "secondary" : "outline"} className="capitalize">
              {job.status}
            </Badge>
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={`/jobs/${job.id}?tab=candidates`}>
            <Badge variant="outline" className="cursor-pointer px-3 py-1.5 text-sm hover:bg-secondary">
              Invite Candidates
            </Badge>
          </Link>
          <CopyLinkButton url={jobUrl} />
          <PreviewInterviewButton jobId={job.id} />
        </div>
      </div>

      <PublishBar jobId={job.id} status={job.status} />

      <Tabs key={tab ?? "overview"} defaultValue={tab ?? "overview"}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-interviewer">AI Interviewer</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-4 py-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Candidates invited</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{candidateRows.length}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Interviews completed</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{completedCount}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Reports ready</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{reportsReadyCount}</p>
                </div>
              </CardContent>
            </Card>

            {job.context && (
              <Card>
                <CardContent className="py-5">
                  <p className="text-xs font-semibold text-foreground">Job description &amp; context</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{job.context}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="py-5">
                <p className="text-xs font-semibold text-foreground">Recent activity</p>
                <div className="mt-2 divide-y divide-border">
                  {recentActivity.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="text-foreground">{row.action}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                  {recentActivity.length === 0 && <p className="py-2 text-sm text-muted-foreground">No activity yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-interviewer">
          <GenerateInterviewPanel
            jobId={job.id}
            config={
              config
                ? {
                    interviewerRole: config.interviewerRole,
                    focusAreas: config.focusAreas,
                    questions: config.questions,
                    tone: config.tone,
                    openingLine: config.openingLine,
                    closingLine: config.closingLine,
                    followUpGuidance: config.followUpGuidance,
                    avoidList: config.avoidList,
                  }
                : null
            }
          />
        </TabsContent>

        <TabsContent value="candidates">
          <div className="space-y-8">
            {job.status === "published" ? (
              <InvitePanel jobId={job.id} />
            ) : (
              <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
                Publish this job before inviting candidates.
              </p>
            )}

            <div>
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Candidates <span className="text-muted-foreground">({candidateRows.length})</span>
              </h2>
              <CandidatePipeline rows={candidateRows} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <JobDetailsForm
            action={updateAction}
            submitLabel="Save changes"
            defaults={{
              title: job.title,
              department: job.department ?? "",
              location: job.location ?? "",
              employmentType: job.employmentType ?? "",
              seniorityLevel: job.seniorityLevel ?? "",
              context: job.context ?? "",
              candidateInstructions: job.candidateInstructions ?? "",
              maxDurationMinutes: job.maxDurationMinutes,
              deadlineAt: toDatetimeLocal(job.deadlineAt),
              cameraRequired: job.cameraRequired,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
