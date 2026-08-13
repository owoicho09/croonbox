import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic } from "@/lib/ai/anthropic";

const MODEL = process.env.ANTHROPIC_INTERVIEW_MODEL ?? "claude-opus-5";

const SYSTEM_PROMPT = `You are designing a structured, focused first-round interview for a hiring team. You are
not conducting the interview yourself — you are producing the plan that a separate AI interviewer will follow
in a live voice conversation with the candidate.

Hard constraints:
- Produce 4 to 6 questions maximum. Never more. The interview must feel like a focused conversation with a real
  interviewer, not an endless chatbot.
- Questions must stay strictly relevant to the job description/context provided.
- Never include illegal or inappropriate hiring questions: age, race, religion, national origin, marital/family
  status, disability, pregnancy, sexual orientation, or anything not job-related.
- Do not design for numeric scoring, ranking, or personality/emotion analysis of any kind. This product never
  produces numbers, percentages, or ratings.`;

const questionSchema = z.object({
  topic: z.string(),
  prompt: z.string(),
  followUpGuidance: z.string().optional(),
});

const interviewConfigSchema = z.object({
  interviewerRole: z.string(),
  focusAreas: z.array(z.string()),
  questions: z.array(questionSchema).min(1).max(6),
  tone: z.string(),
  openingLine: z.string(),
  closingLine: z.string(),
  followUpGuidance: z.string(),
  avoidList: z.array(z.string()),
});

export type InterviewConfigDraft = z.infer<typeof interviewConfigSchema>;

export async function generateInterviewConfig(params: {
  jobTitle: string;
  context: string;
  guidanceNote?: string;
}): Promise<InterviewConfigDraft> {
  const { jobTitle, context, guidanceNote } = params;

  const userPrompt = `Job title: ${jobTitle}

Job description / requirements / interview context:
"""
${context}
"""
${guidanceNote ? `\nAdditional guidance from the hiring team for this version — apply it: ${guidanceNote}` : ""}

Generate the interview plan with:
- "interviewerRole": the persona the AI interviewer should play (e.g. "a senior engineering manager running a focused screening call"), 1 sentence
- "focusAreas": 3-5 short phrases naming what this interview should focus on
- "questions": 4-6 objects, each with:
   - "topic": short label for the question
   - "prompt": the actual question the AI interviewer will ask, phrased naturally and conversationally
   - "followUpGuidance": (optional) what a good follow-up probe looks like if the candidate's answer is vague
- "tone": 1 short phrase describing the interview's tone (e.g. "warm, professional, conversational")
- "openingLine": the literal first thing the AI interviewer says to the candidate — a brief, warm, natural self-introduction (name/role) and a one-line intro to the conversation, phrased like a real person greeting someone, not reading from a script. 1-2 sentences.
- "closingLine": the literal line the AI interviewer uses to wrap up naturally once all questions are covered
- "followUpGuidance": 1-2 sentences of general guidance for how the AI should probe deeper across the whole interview
- "avoidList": short list of topics/behaviors the AI interviewer must avoid (illegal questions, going off-topic, rambling, more than one follow-up per question, etc.)`;

  const response = await getAnthropic().messages.parse({
    model: MODEL,
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    output_config: { format: zodOutputFormat(interviewConfigSchema) },
  });

  if (!response.parsed_output) throw new Error("Anthropic returned no parsable interview config");

  // Enforce the hard cap even if the model drifts.
  return { ...response.parsed_output, questions: response.parsed_output.questions.slice(0, 6) };
}
