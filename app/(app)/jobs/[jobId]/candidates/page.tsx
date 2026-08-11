import { redirect } from "next/navigation";

export default async function JobCandidatesRedirect({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  redirect(`/jobs/${jobId}?tab=candidates`);
}
