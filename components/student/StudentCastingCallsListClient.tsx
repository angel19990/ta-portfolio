"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { CastingCallStudentSidePanel } from "@/components/student/CastingCallStudentSidePanel"
import type { CastingCallRow } from "@/lib/db/casting-calls"

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type Props = {
  calls: CastingCallRow[]
}

export function StudentCastingCallsListClient({ calls }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId
    ? calls.find((c) => c.id === selectedId) ?? null
    : null

  // Auto-open the panel when arriving with ?call=<id> (e.g. deep-link from
  // /student/applications). Strip the param afterwards.
  useEffect(() => {
    const callParam = searchParams.get("call")
    if (!callParam) return
    if (calls.some((c) => c.id === callParam)) {
      setSelectedId(callParam)
    }
    const next = new URLSearchParams(searchParams.toString())
    next.delete("call")
    const qs = next.toString()
    router.replace(qs ? `/student/casting-calls?${qs}` : "/student/casting-calls")
  }, [calls, searchParams, router])

  return (
    <>
      <ul className="divide-y border-t border-b border-foreground/10">
        {calls.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setSelectedId(c.id)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left outline-none hover:bg-muted/40 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div className="min-w-0">
                <span className="block truncate font-medium">{c.title}</span>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {[c.production_company, c.project_type, c.location]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground">
                {c.deadline
                  ? `Apply by ${formatDeadline(c.deadline)}`
                  : "No deadline"}
              </div>
            </button>
          </li>
        ))}
      </ul>
      <CastingCallStudentSidePanel
        call={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      />
    </>
  )
}
