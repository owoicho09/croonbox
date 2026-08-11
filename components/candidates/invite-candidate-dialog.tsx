"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type JobOption = { id: string; title: string; status: string };

export function InviteCandidateDialog({ jobs }: { jobs: JobOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const publishedJobs = jobs.filter((j) => j.status === "published");
  const [selectedJobId, setSelectedJobId] = useState(publishedJobs[0]?.id ?? "");

  function handleContinue() {
    if (!selectedJobId) return;
    setOpen(false);
    router.push(`/jobs/${selectedJobId}?tab=candidates`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-auto">
          <UserPlus className="h-4 w-4" /> Invite Candidate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a candidate</DialogTitle>
          <DialogDescription>Choose which job this candidate is interviewing for.</DialogDescription>
        </DialogHeader>

        {publishedJobs.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {jobs.length === 0
                ? "You don't have any jobs yet. Create one and publish it to start inviting candidates."
                : "None of your jobs are published yet. Publish a job before inviting candidates."}
            </p>
            <Button asChild className="w-auto">
              <Link href="/jobs/new">
                <Plus className="h-4 w-4" /> Create a job
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="invite-job">Job</Label>
              <select
                id="invite-job"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {publishedJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleContinue}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
