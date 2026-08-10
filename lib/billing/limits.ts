import "server-only";
import { eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

export const PLAN_LIMITS = {
  starter: { maxActiveJobs: 3, maxInterviewsPerMonth: 50 },
  professional: { maxActiveJobs: Infinity, maxInterviewsPerMonth: Infinity },
  enterprise: { maxActiveJobs: Infinity, maxInterviewsPerMonth: Infinity },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export async function canCreateActiveJob(organizationId: string, plan: Plan) {
  const limit = PLAN_LIMITS[plan].maxActiveJobs;
  if (limit === Infinity) return true;

  const [row] = await db
    .select({ value: count() })
    .from(jobs)
    .where(and(eq(jobs.organizationId, organizationId), eq(jobs.status, "published")));

  return (row?.value ?? 0) < limit;
}
