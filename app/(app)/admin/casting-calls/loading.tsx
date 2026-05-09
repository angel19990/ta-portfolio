import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCastingCallsLoading() {
  return (
    <>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <ul className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 max-w-md" />
              <Skeleton className="h-3 w-1/3 max-w-[200px]" />
            </div>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-9 w-24" />
          </li>
        ))}
      </ul>
    </>
  );
}
