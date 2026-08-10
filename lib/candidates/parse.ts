import Papa from "papaparse";
import { candidateRowSchema, type CandidateRow } from "@/lib/validation/candidate";

/**
 * Expects two columns per row, in order: email, name. No header row.
 * Used for both pasted bulk text and uploaded .csv files.
 */
export function parseCandidateRows(raw: string): { rows: CandidateRow[]; errors: string[] } {
  const parsed = Papa.parse<string[]>(raw.trim(), { skipEmptyLines: true });

  const rows: CandidateRow[] = [];
  const errors: string[] = [];
  const seenEmails = new Set<string>();

  parsed.data.forEach((cols, i) => {
    const [emailRaw, nameRaw] = cols;
    const email = emailRaw?.trim().toLowerCase();
    const name = nameRaw?.trim();

    const result = candidateRowSchema.safeParse({ email, name });
    if (!result.success) {
      errors.push(`Line ${i + 1}: expected "email,name" — got "${cols.join(",")}"`);
      return;
    }

    if (seenEmails.has(result.data.email)) {
      errors.push(`Line ${i + 1}: duplicate email ${result.data.email} skipped`);
      return;
    }
    seenEmails.add(result.data.email);
    rows.push(result.data);
  });

  return { rows, errors };
}
