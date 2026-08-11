import { Skeleton } from "@/components/ui/skeleton";

export default function CandidateDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-5 w-24" />
      </div>

      <Skeleton className="h-10 w-full max-w-xs rounded-lg" />
      <Skeleton className="h-9 w-80 rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
