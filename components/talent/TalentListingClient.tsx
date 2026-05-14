"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ActorCard } from "@/components/talent/ActorCard"
import {
  TalentSidePanel,
  type TalentRow,
} from "@/components/talent/TalentSidePanel"

type Props = {
  actors: TalentRow[]
}

const ETHNICITY_CHIPS = 10
const LOCATION_CHIPS = 8

export function TalentListingClient({ actors }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEthnicities, setSelectedEthnicities] = useState<Set<string>>(
    new Set(),
  )
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(
    new Set(),
  )
  const selected = selectedId
    ? actors.find((a) => a.id === selectedId) ?? null
    : null

  // Aggregate ethnicities + locations by frequency from the visible roster.
  const ethnicityChips = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of actors) {
      const e = a.ethnicity?.trim()
      if (!e) continue
      counts.set(e, (counts.get(e) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, ETHNICITY_CHIPS)
      .map(([ethnicity]) => ethnicity)
  }, [actors])

  const locationChips = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of actors) {
      const loc = a.location?.trim()
      if (!loc) continue
      counts.set(loc, (counts.get(loc) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, LOCATION_CHIPS)
      .map(([loc]) => loc)
  }, [actors])

  const activeCount = selectedEthnicities.size + selectedLocations.size

  const filteredActors = useMemo(() => {
    if (activeCount === 0) return actors
    return actors.filter((a) => {
      if (selectedEthnicities.size > 0) {
        const e = a.ethnicity?.trim() ?? ""
        if (!selectedEthnicities.has(e)) return false
      }
      if (selectedLocations.size > 0) {
        const loc = a.location?.trim() ?? ""
        if (!selectedLocations.has(loc)) return false
      }
      return true
    })
  }, [actors, selectedEthnicities, selectedLocations, activeCount])

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  function clearAll() {
    setSelectedEthnicities(new Set())
    setSelectedLocations(new Set())
  }

  // Auto-open the panel when arriving with ?actor=<id>. Strip the param so
  // Back doesn't re-pop it and so reload doesn't fight with manual close.
  useEffect(() => {
    const actorParam = searchParams.get("actor")
    if (!actorParam) return
    if (actors.some((a) => a.id === actorParam)) {
      setSelectedId(actorParam)
    }
    const next = new URLSearchParams(searchParams.toString())
    next.delete("actor")
    const qs = next.toString()
    router.replace(qs ? `/?${qs}` : "/")
  }, [actors, searchParams, router])

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Filters
            {activeCount > 0 ? (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            ) : null}
          </p>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
            >
              <XIcon className="size-3" />
              Clear all
            </button>
          ) : null}
        </div>

        {locationChips.length > 0 ? (
          <FilterGroup
            label="Location"
            items={locationChips.map((l) => ({ id: l, label: l }))}
            isActive={(id) => selectedLocations.has(id)}
            onToggle={(id) =>
              setSelectedLocations((prev) => toggle(prev, id))
            }
          />
        ) : null}

        {ethnicityChips.length > 0 ? (
          <FilterGroup
            label="Ethnicity"
            items={ethnicityChips.map((e) => ({ id: e, label: e }))}
            isActive={(id) => selectedEthnicities.has(id)}
            onToggle={(id) =>
              setSelectedEthnicities((prev) => toggle(prev, id))
            }
          />
        ) : null}
      </div>

      {filteredActors.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No actors match the current filters. Clear a chip to widen the
          search.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {filteredActors.map((row) => (
            <li key={row.id}>
              <ActorCard
                fullName={row.full_name}
                location={row.location}
                headshotUrl={row.headshot_url}
                skills={row.skills ?? []}
                onSelect={() => setSelectedId(row.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <TalentSidePanel
        actor={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      />
    </>
  )
}

type FilterItem = { id: string; label: string }

function FilterGroup({
  label,
  items,
  isActive,
  onToggle,
}: {
  label: string
  items: FilterItem[]
  isActive: (id: string) => boolean
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <p className="min-w-16 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <ul className="flex flex-1 flex-wrap gap-1.5">
        {items.map((item) => {
          const active = isActive(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                aria-pressed={active}
                className="outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-4xl"
              >
                <Badge
                  variant={active ? "success" : "outline"}
                  className="cursor-pointer transition-colors"
                >
                  {item.label}
                </Badge>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
