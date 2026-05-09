import { Skeleton } from "@/components/ui/skeleton";

export default function AdminApprovalsLoading() {
  return (
    <>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-start gap-4 rounded-lg border p-4"
          >
            <Skeleton className="size-16 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 max-w-[180px]" />
              <Skeleton className="h-3 w-2/3 max-w-[260px]" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
            <Skeleton className="h-9 w-24" />
          </li>
        ))}
      </ul>
    </>
  );
}
