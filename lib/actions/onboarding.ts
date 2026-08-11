"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { organizations, memberships, subscriptions } from "@/lib/db/schema";
import { requireUser } from "@/lib/actions/auth";
import { slugWithSuffix } from "@/lib/org/slug";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email/templates";
import type { ActionState } from "@/lib/actions/auth";

const schema = z.object({
  companyName: z.string().trim().min(1, "Enter your company name").max(160),
});

export async function createWorkspaceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = schema.safeParse({ companyName: formData.get("companyName") });
  if (!parsed.success) {
    return { fieldErrors: { companyName: parsed.error.flatten().fieldErrors.companyName?.[0] ?? "Invalid" } };
  }

  const organizationId = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name: parsed.data.companyName, slug: slugWithSuffix(parsed.data.companyName) })
      .returning({ id: organizations.id });

    await tx.insert(memberships).values({ organizationId: org.id, userId: user.id, role: "owner" });
    await tx.insert(subscriptions).values({ organizationId: org.id, plan: "starter", status: "active" });

    return org.id;
  });

  await sendEmail({
    organizationId,
    type: "employer_welcome",
    to: user.email,
    subject: "Welcome to Croonbox",
    html: welcomeEmail({
      name: user.name,
      companyName: parsed.data.companyName,
      jobsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/jobs/new`,
    }),
  });

  redirect("/dashboard");
}
