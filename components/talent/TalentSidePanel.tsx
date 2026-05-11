"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { ResumeViewButton } from "@/components/talent/ResumeViewButton"
import { transformedImage } from "@/lib/util/storage-image"
import {
  loadActorDetail,
  type ActorDetail,
} from "@/app/(app)/talent/actions"

export type TalentRow = {
  id: string
  full_name: string | null
  location: string | null
  bio: string | null
  skills: string[] | null
  headshot_url: string | null
}

type Props = {
  actor: TalentRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TalentSidePanel({ actor, open, onOpenChange }: Props) {
  type DetailState = {
    forActorId: string
    loading: boolean
    payload: ActorDetail | null
  } | null
  const [detailState, setDetailState] = useState<DetailState>(null)

  const actorId = actor?.id ?? null
  const visibleDetail =
    detailState && detailState.forActorId === actorId
      ? detailState.payload
      : null
  const detailLoading =
    detailState != null &&
    detailState.forActorId === actorId &&
    detailState.loading

  useEffect(() => {
    if (!actorId) return
    let cancelled = false
    setDetailState({ forActorId: actorId, loading: true, payload: null })
    loadActorDetail(actorId).then((result) => {
      if (cancelled) return
      setDetailState((prev) => {
        if (!prev || prev.forActorId !== actorId) return prev
        if ("error" in result) {
          toast.error(result.error)
          return { forActorId: actorId, loading: false, payload: null }
        }
        return {
          forActorId: actorId,
          loading: false,
          payload: result.detail,
        }
      })
    })
    return () => {
      cancelled = true
    }
  }, [actorId])

  if (!actor) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg" />
      </Sheet>
    )
  }

  const displayName = actor.full_name ?? "Unnamed"
  const subline = actor.location ?? ""

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle className="truncate">{displayName}</SheetTitle>
          <SheetDescription className="truncate">
            {subline || "—"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border bg-muted">
            {actor.headshot_url ? (
              <Image
                src={transformedImage(actor.headshot_url, { width: 600 })!}
                alt={displayName}
                fill
                sizes="(max-width: 640px) 100vw, 480px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                No headshot
              </div>
            )}
          </div>

          {actor.bio ? (
            <Section title="Bio">
              <p className="whitespace-pre-wrap text-sm">{actor.bio}</p>
            </Section>
          ) : null}

          <Section title="Details">
            <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <Row label="Location" value={actor.location} />
              <Row
                label="Ethnicity"
                value={
                  detailLoading && !visibleDetail
                    ? "Loading…"
                    : visibleDetail?.ethnicity
                }
              />
              <Row
                label="Current Job"
                value={
                  detailLoading && !visibleDetail
                    ? "Loading…"
                    : visibleDetail?.current_job
                }
              />
              <Row
                label="Favorite Movies"
                value={
                  detailLoading && !visibleDetail
                    ? "Loading…"
                    : visibleDetail?.favorite_movies
                }
              />
              <Row
                label="Favorite Series"
                value={
                  detailLoading && !visibleDetail
                    ? "Loading…"
                    : visibleDetail?.favorite_series
                }
              />
              <Row
                label="Skills"
                value={
                  actor.skills && actor.skills.length > 0
                    ? actor.skills.join(", ")
                    : null
                }
              />
            </dl>
          </Section>

          <Section title="Gallery">
            {detailLoading && !visibleDetail ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
            ) : !visibleDetail || visibleDetail.photos.length === 0 ? (
              <Empty>No additional photos.</Empty>
            ) : (
              <ul className="grid grid-cols-2 gap-2">
                {visibleDetail.photos.map((p, i) => (
                  <li
                    key={p.id}
                    className="relative aspect-square overflow-hidden rounded-md border bg-muted"
                  >
                    <Image
                      src={transformedImage(p.url, { width: 400 })!}
                      alt={`Gallery photo ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 33vw, 160px"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {!detailLoading && visibleDetail?.resume_url ? (
            <Section title="Resume">
              <ResumeViewButton actorProfileId={actor.id} />
            </Section>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Row({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate">
        {value && value.trim().length > 0 ? (
          value
        ) : (
          <span className="italic text-muted-foreground">—</span>
        )}
      </dd>
    </>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      {children}
    </p>
  )
}

