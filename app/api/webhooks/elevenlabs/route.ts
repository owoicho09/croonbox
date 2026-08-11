import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewSessions } from "@/lib/db/schema";
import { verifyWebhookSignature } from "@/lib/elevenlabs";
import { ingestSessionTranscript } from "@/lib/elevenlabs/ingest";

type PostCallWebhookPayload = {
  type: string;
  data: {
    conversation_id: string;
    transcript?: { role: string; message: string | null }[];
    status?: string;
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("elevenlabs-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PostCallWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (payload.type !== "post_call_transcription") {
    return NextResponse.json({ received: true });
  }

  const conversationId = payload.data.conversation_id;

  const [session] = await db
    .select({ id: interviewSessions.id })
    .from(interviewSessions)
    .where(eq(interviewSessions.elevenLabsConversationId, conversationId))
    .limit(1);

  if (!session) {
    // Unknown conversation — acknowledge so ElevenLabs doesn't retry forever, but do nothing.
    return NextResponse.json({ received: true });
  }

  await ingestSessionTranscript(session.id, payload.data.transcript ?? []);

  return NextResponse.json({ received: true });
}
