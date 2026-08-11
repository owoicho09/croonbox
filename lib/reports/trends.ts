import "server-only";
import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidateInvitations, candidates, interviewSessions, jobs } from "@/lib/db/schema";

export type TrendDay = { key: string; label: string; value: number };

// Completions per day over the last 14 days, for a simple trend view. Kept in a plain
// (non-component) module so the current-time math doesn't trip the React purity lint rule.
export async function getCompletionTrend(organizationId: string): Promise<TrendDay[]> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const trendRows = await db
    .select({ day: sql<string>`date(${interviewSessions.completedAt})`, value: sql<number>`count(*)` })
    .from(candidateInvitations)
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
    .innerJoin(interviewSessions, eq(interviewSessions.invitationId, candidateInvitations.id))
    .where(
      and(
        eq(jobs.organizationId, organizationId),
        eq(candidates.isPreview, false),
        gte(interviewSessions.completedAt, fourteenDaysAgo),
      ),
    )
    .groupBy(sql`date(${interviewSessions.completedAt})`)
    .orderBy(sql`date(${interviewSessions.completedAt})`);

  const trendMap = new Map(trendRows.map((r) => [r.day, r.value]));

  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), value: trendMap.get(key) ?? 0 };
  });
}
