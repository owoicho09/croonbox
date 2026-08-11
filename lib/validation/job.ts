import { z } from "zod";

export const employmentTypeValues = ["full_time", "part_time", "contract", "internship"] as const;

export const jobDetailsSchema = z.object({
  title: z.string().trim().min(1, "Enter a job title").max(160),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  employmentType: z.enum(employmentTypeValues).optional().or(z.literal("")),
  seniorityLevel: z.string().trim().max(60).optional().or(z.literal("")),
  context: z.string().trim().min(1, "Describe the role so the AI can build the interview").max(6000),
  candidateInstructions: z.string().trim().max(4000).optional().or(z.literal("")),
  maxDurationMinutes: z.coerce.number().int().min(5).max(60),
  deadlineAt: z.string().optional().or(z.literal("")),
});

export const generateInterviewSchema = z.object({
  guidanceNote: z.string().trim().max(500).optional().or(z.literal("")),
});
