import { cn } from "@/lib/utils"

// Wrap loading.tsx skeleton trees so screen readers announce a loading state
// while the route segment streams. The visually-hidden span gives SRs a label
// without affecting the visual skeleton.
export function LoadingRegion({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(className)}
    >
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  )
}
