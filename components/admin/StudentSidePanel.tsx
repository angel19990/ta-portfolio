"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { approveActor } from "@/app/(app)/admin/approvals/actions"
import type { AdminStudent, StudentStatus } from "@/lib/db/students"

const STATUS_LABEL: Record<StudentStatus, string> = {
  inactive: "Inactive",
  pending_approval: "Pending approval",
  approved: "Approved",
  private: "Private",
}

const STATUS_VARIANT: Record<
  StudentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  inactive: "destructive",
  pending_approval: "default",
  approved: "secondary",
  private: "outline",
}

type Props = {
  student: AdminStudent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentSidePanel({ student, open, onOpenChange }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (!student) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg" />
      </Sheet>
    )
  }

  const actor = student.actor_profile
  const displayName = student.full_name ?? "Unnamed"

  function onApprove() {
    if (!actor) return
    startTransition(async () => {
      const result = await approveActor(actor.id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(`Approved ${displayName}`)
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <div className="flex items-start gap-3">
            <div className="size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
              {actor?.headshot_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={actor.headshot_url}
                  alt={displayName}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                  No photo
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{displayName}</SheetTitle>
              <SheetDescription className="truncate">
                {student.email}
              </SheetDescription>
              <div className="mt-1.5">
                <Badge variant={STATUS_VARIANT[student.status]}>
                  {STATUS_LABEL[student.status]}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <Section title="Profile">
            {!actor ? (
              <Empty>Student hasn’t filled out their profile yet.</Empty>
            ) : (
              <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-sm">
                <Row label="Age" value={actor.age?.toString()} />
                <Row label="Location" value={actor.location} />
                <Row
                  label="Skills"
                  value={
                    actor.skills && actor.skills.length > 0
                      ? actor.skills.join(", ")
                      : null
                  }
                />
                <Row label="Bio" value={actor.bio} block />
              </dl>
            )}
          </Section>

          {student.status === "pending_approval" && actor ? (
            <Section title="Approval">
              <p className="mb-2 text-sm text-muted-foreground">
                Profile is set to public but not yet approved. Approve to make
                visible to industry users.
              </p>
              <Button type="button" onClick={onApprove} disabled={isPending}>
                {isPending ? "Approving…" : "Approve"}
              </Button>
            </Section>
          ) : null}

          <Section title="Classes">
            <Empty>Add-class flow lands in Phase 3 Task 2.</Empty>
          </Section>

          <Section title="Dues">
            <Empty>Payment tracking lands in Phase 3 Task 3.</Empty>
          </Section>

          <Section title="Notes">
            <Empty>Notes thread lands in Phase 3 Task 4.</Empty>
          </Section>
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
  block = false,
}: {
  label: string
  value: string | null | undefined
  block?: boolean
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          block
            ? "whitespace-pre-wrap break-words"
            : "truncate"
        }
      >
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
