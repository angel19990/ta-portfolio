import { LoadingRegion } from "@/components/ui/loading-region";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentProfileLoading() {
  return (
    <LoadingRegion>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex items-start gap-4 rounded-lg border p-4">
          <Skeleton className="size-24 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-56 max-w-full" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        <div className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-lg border p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </LoadingRegion>
  );
}
