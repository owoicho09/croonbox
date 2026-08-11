import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminOverviewLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-7 w-32" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 py-6">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
