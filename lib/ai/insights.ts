import "server-only";
import { z } from "zod";
import { getOpenAI } from "@/lib/ai/openai";

const MODEL = process.env.OPENAI_INSIGHTS_MODEL ?? "gpt-4.1";

const SYSTEM_PROMPT = `You are a hiring assistant that helps recruiters review structured, asynchronous video interview responses.

You produce qualitative insights only. You must NEVER include:
- numeric scores, percentages, ratings, or grades of any kind (e.g. "8/10", "83%", "4.5 stars")
- confidence scores or probability estimates
- personality, emotion, tone-of-voice, or facial-expression analysis
- comparisons ranking this candidate against others

Base your analysis strictly on the content of what the candidate said in the transcript. If the transcript is
too short or off-topic to say much, say so plainly instead of inventing detail. The hiring team makes the final
decision — your job is to surface useful, specific, evidence-based observations, not verdicts.

Respond with strict JSON matching the requested shape. No markdown, no commentary outside the JSON.`;

const responseInsightSchema = z.object({
  summary: z.string(),
  evidence: z.array(z.string()),
  strongSignals: z.array(z.string()),
  areasToReview: z.array(z.string()),
});

export type ResponseInsight = z.infer<typeof responseInsightSchema>;

export async function generateResponseInsights(params: {
  jobTitle: string;
  question: string;
  evaluationGuidance: string | null;
  transcript: string;
}): Promise<ResponseInsight> {
  const { jobTitle, question, evaluationGuidance, transcript } = params;

  const userPrompt = `Job: ${jobTitle}
Interview question: ${question}
${evaluationGuidance ? `What a strong answer should cover (internal guidance from the hiring team, not shown to the candidate): ${evaluationGuidance}` : ""}

Candidate's transcribed answer:
"""
${transcript}
"""

Return JSON with exactly these keys:
- "summary": 2-3 sentence plain-language summary of what the candidate actually said
- "evidence": array of short direct quotes or close paraphrases from the transcript that support the summary
- "strongSignals": array of specific, concrete strengths shown in this answer (empty array if none)
- "areasToReview": array of specific gaps, vague points, or things worth a human follow-up (empty array if none)`;

  const completion = await getOpenAI().chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return responseInsightSchema.parse(JSON.parse(raw));
}

const sessionInsightSchema = z.object({
  overallSummary: z.string(),
  relevantExperience: z.array(z.string()),
  areasToExplore: z.array(z.string()),
  suggestedFollowUps: z.array(z.string()),
});

export type SessionInsight = z.infer<typeof sessionInsightSchema>;

export async function generateSessionInsights(params: {
  jobTitle: string;
  perQuestion: { question: string; summary: string }[];
}): Promise<SessionInsight> {
  const { jobTitle, perQuestion } = params;

  const userPrompt = `Job: ${jobTitle}

Here is a summary of the candidate's answer to each interview question:
${perQuestion.map((q, i) => `${i + 1}. Q: ${q.question}\n   Summary: ${q.summary}`).join("\n")}

Return JSON with exactly these keys:
- "overallSummary": 3-4 sentence overview of the candidate's performance across the whole interview
- "relevantExperience": array of specific relevant experience or skills the candidate demonstrated
- "areasToExplore": array of specific topics worth probing further in a follow-up conversation
- "suggestedFollowUps": array of concrete follow-up questions a human interviewer could ask next`;

  const completion = await getOpenAI().chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return sessionInsightSchema.parse(JSON.parse(raw));
}
