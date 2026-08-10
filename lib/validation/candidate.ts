import { z } from "zod";

export const singleCandidateSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(160),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const candidateRowSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().email(),
});

export type CandidateRow = z.infer<typeof candidateRowSchema>;
