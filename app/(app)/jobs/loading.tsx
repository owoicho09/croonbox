import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function JobsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="mt-8 grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between py-5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
