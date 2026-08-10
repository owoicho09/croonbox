"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "not_started", label: "Invited" },
  { value: "in_progress", label: "Started" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "ready_for_review", label: "Ready for Review" },
  { value: "reviewed", label: "Reviewed" },
];

export function CandidateFilterBar({
  search,
  status,
  reviewQueue,
}: {
  search: string;
  status: string;
  reviewQueue: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search);
  const [, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | boolean | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) params.delete(key);
        else params.set(key, String(value));
      }
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router, searchParams],
  );

  // Debounce search input before pushing to the URL.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) updateParams({ q: searchInput || undefined });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search candidates or jobs…"
          className="pl-9"
        />
      </div>

      <select
        value={status}
        onChange={(e) => updateParams({ status: e.target.value || undefined, reviewQueue: undefined })}
        className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <Button
        type="button"
        variant={reviewQueue ? "default" : "outline"}
        size="sm"
        className={cn("w-auto", reviewQueue && "shrink-0")}
        onClick={() => updateParams({ reviewQueue: reviewQueue ? undefined : "1", status: undefined })}
      >
        <Sparkles className="h-4 w-4" /> My Review Queue
      </Button>

      {(search || status || reviewQueue) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-auto"
          onClick={() => {
            setSearchInput("");
            router.push(pathname);
          }}
        >
          <X className="h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
