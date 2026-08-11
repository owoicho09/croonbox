import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewSessions, transcripts, processingJobs } from "@/lib/db/schema";

type RawTurn = { role: string; message: string | null | undefined };

// Shared by the ElevenLabs webhook and the manual "sync transcript" fallback so both paths
// save the transcript, advance the session, and enqueue the AI report job identically.
export async function ingestSessionTranscript(sessionId: string, rawTurns: RawTurn[]) {
  const turns = rawTurns
    .filter((t) => t.message)
    .map((t) => ({ role: t.role === "agent" ? ("agent" as const) : ("candidate" as const), text: t.message as string }));

  const text = turns.map((t) => `${t.role === "agent" ? "Interviewer" : "Candidate"}: ${t.text}`).join("\n");

  await db
    .insert(transcripts)
    .values({ sessionId, text, turns, provider: "elevenlabs" })
    .onConflictDoUpdate({ target: transcripts.sessionId, set: { text, turns } });

  await db.update(interviewSessions).set({ status: "processing", updatedAt: new Date() }).where(eq(interviewSessions.id, sessionId));

  await db.insert(processingJobs).values({ type: "generate_ai_report", payload: { sessionId } });
}
