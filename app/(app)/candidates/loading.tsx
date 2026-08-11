import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function CandidatesLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3.5">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
