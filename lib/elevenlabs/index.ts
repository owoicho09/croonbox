import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE = "https://api.elevenlabs.io/v1";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

/**
 * Mints a short-lived signed WebSocket URL for a private ElevenLabs Conversational AI agent.
 * The candidate's browser connects directly to this URL — our API key never reaches the client.
 */
export async function getSignedConversationUrl(): Promise<string> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const agentId = requireEnv("ELEVENLABS_AGENT_ID");

  const res = await fetch(`${API_BASE}/convai/conversation/get-signed-url?agent_id=${agentId}`, {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ElevenLabs signed URL request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { signed_url: string };
  return data.signed_url;
}

/** Dynamic variables injected into the agent's prompt/first-message via {{variable}} placeholders. */
export function buildInterviewDynamicVariables(params: {
  jobTitle: string;
  companyName: string;
  candidateName: string;
  interviewerRole: string;
  focusAreas: string[];
  questions: { topic: string; prompt: string; followUpGuidance?: string }[];
  tone: string;
  openingLine: string;
  closingLine: string;
  followUpGuidance: string;
  avoidList: string[];
  maxDurationMinutes: number;
}) {
  return {
    job_title: params.jobTitle,
    company_name: params.companyName,
    candidate_name: params.candidateName,
    interviewer_role: params.interviewerRole,
    focus_areas: params.focusAreas.join("; "),
    questions: params.questions
      .map((q, i) => `${i + 1}. ${q.prompt}${q.followUpGuidance ? ` (follow-up: ${q.followUpGuidance})` : ""}`)
      .join("\n"),
    tone: params.tone,
    opening_line: params.openingLine,
    closing_line: params.closingLine,
    follow_up_guidance: params.followUpGuidance,
    avoid_list: params.avoidList.join("; "),
    max_duration_minutes: String(params.maxDurationMinutes),
  };
}

export async function fetchConversationTranscript(conversationId: string) {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");

  const res = await fetch(`${API_BASE}/convai/conversations/${conversationId}`, {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ElevenLabs conversation fetch failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<{
    transcript?: { role: string; message: string }[];
    status?: string;
  }>;
}

/** Verifies the HMAC signature ElevenLabs sends on post-call webhooks. */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  // Header format: "t=<timestamp>,v0=<hex hmac>"
  const parts = Object.fromEntries(signatureHeader.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = parts.t;
  const signature = parts.v0;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}
