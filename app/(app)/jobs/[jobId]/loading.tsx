import { Skeleton } from "@/components/ui/skeleton";

export default function JobDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-5 w-24" />
      </div>

      <Skeleton className="h-16 w-full rounded-xl" />

      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
