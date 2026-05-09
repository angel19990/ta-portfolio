import { Skeleton } from "@/components/ui/skeleton";

export default function StudentApplicationsLoading() {
  return (
    <>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="rounded-lg border">
        <div className="grid grid-cols-[1fr_120px_120px_100px] items-center gap-4 border-b px-4 py-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_120px_120px_100px] items-center gap-4 border-b px-4 py-3 last:border-b-0"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-2/3 max-w-sm" />
              <Skeleton className="h-3 w-1/3 max-w-[160px]" />
            </div>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>
    </>
  );
}
