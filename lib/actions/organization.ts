"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import type { ActionState } from "@/lib/actions/auth";

const schema = z.object({ name: z.string().trim().min(1, "Enter a company name").max(160) });

export async function updateOrganizationNameAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { organization } = await requireOrgContext();

  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: { name: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid" } };
  }

  await db.update(organizations).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(organizations.id, organization.id));
  revalidatePath("/settings");
  return { error: undefined };
}
