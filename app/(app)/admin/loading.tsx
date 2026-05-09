import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="space-y-6">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-lg border">
          <div className="grid grid-cols-[48px_1fr_1fr_120px_120px] items-center gap-4 border-b px-4 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[48px_1fr_1fr_120px_120px] items-center gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-2/3 max-w-[180px]" />
              <Skeleton className="h-4 w-2/3 max-w-[200px]" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
