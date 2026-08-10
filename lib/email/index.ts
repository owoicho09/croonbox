import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import type { emailTypeEnum } from "@/lib/db/schema";

let resendClient: Resend | undefined;
function getResendClient() {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

type EmailType = (typeof emailTypeEnum.enumValues)[number];

export async function sendEmail(params: {
  organizationId?: string;
  type: EmailType;
  to: string;
  subject: string;
  html: string;
}) {
  const { organizationId, type, to, subject, html } = params;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Croonbox <notifications@croonbox.app>",
      to,
      subject,
      html,
    });

    if (error) {
      await db.insert(emailLog).values({
        organizationId,
        type,
        recipient: to,
        status: "failed",
        error: error.message,
      });
      return { ok: false as const, error: error.message };
    }

    await db.insert(emailLog).values({
      organizationId,
      type,
      recipient: to,
      providerId: data?.id,
      status: "sent",
    });
    return { ok: true as const, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    await db.insert(emailLog).values({
      organizationId,
      type,
      recipient: to,
      status: "failed",
      error: message,
    });
    return { ok: false as const, error: message };
  }
}
