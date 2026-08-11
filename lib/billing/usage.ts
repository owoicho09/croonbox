import "server-only";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { usageRecords } from "@/lib/db/schema";
import { PLAN_LIMITS, type Plan } from "@/lib/billing/limits";

function currentPeriodStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getCurrentInterviewUsage(organizationId: string) {
  const periodStart = currentPeriodStart();
  const [row] = await db
    .select()
    .from(usageRecords)
    .where(and(eq(usageRecords.organizationId, organizationId), eq(usageRecords.periodStart, periodStart)))
    .limit(1);
  return row?.interviewsCount ?? 0;
}

export function canInviteMore(usedThisMonth: number, plan: Plan) {
  return usedThisMonth < PLAN_LIMITS[plan].maxInterviewsPerMonth;
}

export async function incrementInterviewUsage(organizationId: string, by: number) {
  const periodStart = currentPeriodStart();

  await db
    .insert(usageRecords)
    .values({ organizationId, periodStart, interviewsCount: by })
    .onConflictDoUpdate({
      target: [usageRecords.organizationId, usageRecords.periodStart],
      set: { interviewsCount: sql`${usageRecords.interviewsCount} + ${by}`, updatedAt: new Date() },
    });
}
