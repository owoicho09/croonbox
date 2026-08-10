import { z } from "zod";

export const jobDetailsSchema = z.object({
  title: z.string().trim().min(1, "Enter a job title").max(160),
  candidateInstructions: z.string().trim().max(4000).optional().or(z.literal("")),
  defaultPrepSeconds: z.coerce.number().int().min(0).max(600),
  defaultResponseSeconds: z.coerce.number().int().min(15).max(900),
  retakesAllowed: z.coerce.number().int().min(0).max(5),
  deadlineAt: z.string().optional().or(z.literal("")),
});

export const questionSchema = z.object({
  prompt: z.string().trim().min(1, "Enter a question").max(1000),
  prepSeconds: z.coerce.number().int().min(0).max(600).optional(),
  responseSeconds: z.coerce.number().int().min(15).max(900).optional(),
  evaluationGuidance: z.string().trim().max(2000).optional().or(z.literal("")),
});
