import { Skeleton } from "@/components/ui/skeleton";

export default function IndustryTalentLoading() {
  return (
    <>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-9 w-full max-w-md" />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="overflow-hidden rounded-lg border bg-card"
            >
              <Skeleton className="aspect-[4/5] w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
