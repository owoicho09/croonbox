import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic } from "@/lib/ai/anthropic";

const MODEL = process.env.ANTHROPIC_INSIGHTS_MODEL ?? "claude-opus-5";

const SYSTEM_PROMPT = `You are a hiring assistant that helps recruiters review a completed live AI interview
transcript. You produce qualitative insights only. You must NEVER include:
- numeric scores, percentages, ratings, or grades of any kind (e.g. "8/10", "83%", "4.5 stars")
- confidence scores, match percentages, or probability estimates
- personality, emotion, tone-of-voice, or facial-expression analysis
- comparisons ranking this candidate against others

Base your analysis strictly on the content of what the candidate said in the transcript. If the transcript is
too short or off-topic to say much, say so plainly instead of inventing detail. The hiring team makes the final
decision — your job is to surface useful, specific, evidence-based observations, not a verdict.`;

const reportSchema = z.object({
  summary: z.string(),
  relevantExperience: z.array(z.string()),
  strongSignals: z.array(z.string()),
  areasToReview: z.array(z.string()),
  suggestedFollowUps: z.array(z.string()),
});

export type InterviewReport = z.infer<typeof reportSchema>;

export async function generateInterviewReport(params: {
  jobTitle: string;
  interviewerRole: string;
  focusAreas: string[];
  transcript: string;
}): Promise<InterviewReport> {
  const { jobTitle, interviewerRole, focusAreas, transcript } = params;

  const userPrompt = `Job: ${jobTitle}
Interviewer role: ${interviewerRole}
Focus areas: ${focusAreas.join(", ")}

Full interview transcript (AI interviewer and candidate turns):
"""
${transcript}
"""

Generate the report with:
- "summary": 3-4 sentence plain-language summary of how the interview went and what the candidate said
- "relevantExperience": array of specific relevant experience or skills the candidate demonstrated
- "strongSignals": array of specific, concrete strengths shown across the interview (empty array if none)
- "areasToReview": array of specific gaps, vague points, or things worth a human follow-up (empty array if none)
- "suggestedFollowUps": array of concrete follow-up questions a human interviewer could ask next`;

  const response = await getAnthropic().messages.parse({
    model: MODEL,
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    output_config: { format: zodOutputFormat(reportSchema) },
  });

  if (!response.parsed_output) throw new Error("Anthropic returned no parsable interview report");

  return response.parsed_output;
}
