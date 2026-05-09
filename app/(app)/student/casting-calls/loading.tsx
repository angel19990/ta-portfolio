import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentCastingCallsLoading() {
  return (
    <LoadingRegion>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-5 w-2/3 max-w-sm" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-1/2 max-w-xs" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </LoadingRegion>
  );
}
