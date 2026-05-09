"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
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
import { Textarea } from "@/components/ui/textarea"
import { approveActor } from "@/app/(app)/admin/approvals/actions"
import { addStudentNote } from "@/app/(app)/admin/students/actions"
import type { AdminStudent, StudentStatus } from "@/lib/db/students"
import type { AvailableSection, EnrollmentRow } from "@/lib/db/student-classes"
import type { StudentNote } from "@/lib/db/student-notes"
import { AddClassToStudentDialog } from "@/components/admin/AddClassToStudentDialog"
import { RecordPaymentDialog } from "@/components/admin/RecordPaymentDialog"
import { teacherFromSectionCode } from "@/lib/teachers"

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
  sections: AvailableSection[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentSidePanel({
  student,
  sections,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [addClassOpen, setAddClassOpen] = useState(false)
  const [paymentEnrollmentId, setPaymentEnrollmentId] = useState<string | null>(
    null,
  )

  if (!student) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg" />
      </Sheet>
    )
  }

  const actor = student.actor_profile
  const displayName = student.full_name ?? "Unnamed"
  const enrolledSectionIds = student.enrollments
    .map((e) => e.section?.id)
    .filter((v): v is string => typeof v === "string")

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
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
              {actor?.headshot_url ? (
                <Image
                  src={actor.headshot_url}
                  alt={displayName}
                  fill
                  sizes="56px"
                  className="object-cover"
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

          <Section
            title="Classes"
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAddClassOpen(true)}
              >
                Add class
              </Button>
            }
          >
            {student.enrollments.length === 0 ? (
              <Empty>Not enrolled in any classes yet.</Empty>
            ) : (
              <ul className="space-y-2">
                {student.enrollments.map((e) => (
                  <EnrollmentItem
                    key={e.id}
                    enrollment={e}
                    onRecordPayment={() => setPaymentEnrollmentId(e.id)}
                  />
                ))}
              </ul>
            )}
          </Section>

          <Section title="Dues">
            <Empty>Payment tracking lands in Phase 3 Task 3.</Empty>
          </Section>

          <Section title="Notes">
            <NotesThread profileId={student.id} notes={student.notes} />
          </Section>
        </div>
      </SheetContent>
      <AddClassToStudentDialog
        profileId={student.id}
        studentName={displayName}
        sections={sections}
        excludeSectionIds={enrolledSectionIds}
        open={addClassOpen}
        onOpenChange={setAddClassOpen}
      />
      {(() => {
        const active = student.enrollments.find(
          (e) => e.id === paymentEnrollmentId,
        )
        const className = active?.section?.class?.name ?? "Class"
        return (
          <RecordPaymentDialog
            enrollmentId={paymentEnrollmentId}
            className={className}
            outstandingCents={active?.outstanding_cents ?? 0}
            amountPaidCents={active?.amount_paid_cents ?? 0}
            open={paymentEnrollmentId !== null}
            onOpenChange={(open) => {
              if (!open) setPaymentEnrollmentId(null)
            }}
          />
        )
      })()}
    </Sheet>
  )
}

function EnrollmentItem({
  enrollment,
  onRecordPayment,
}: {
  enrollment: EnrollmentRow
  onRecordPayment: () => void
}) {
  const section = enrollment.section
  const className = section?.class?.name ?? "Unknown class"
  const teacher = section ? teacherFromSectionCode(section.section_code) : null
  const isPaid = enrollment.outstanding_cents <= 0
  return (
    <li className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{className}</p>
          <p className="truncate text-xs text-muted-foreground">
            {section?.section_code ?? "—"}
            {section?.term ? ` · ${section.term}` : ""}
            {teacher ? ` · ${teacher}` : ""}
          </p>
        </div>
        <Badge variant={enrollment.status === "enrolled" ? "secondary" : "outline"}>
          {enrollment.status}
        </Badge>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Payment: {enrollment.payment_status}</span>
        <span>
          {isPaid
            ? "Paid in full"
            : `Owes ${formatCents(enrollment.outstanding_cents)}`}
        </span>
      </div>
      {!isPaid ? (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRecordPayment}
          >
            Record payment
          </Button>
        </div>
      ) : null}
    </li>
  )
}

function NotesThread({
  profileId,
  notes,
}: {
  profileId: string
  notes: StudentNote[]
}) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    startTransition(async () => {
      const result = await addStudentNote(profileId, trimmed)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Note added")
      setBody("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {notes.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No notes yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-md border p-3">
              <p className="whitespace-pre-wrap break-words text-sm">
                {n.body}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {n.author?.full_name ?? "Unknown"} · {formatTimestamp(n.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="space-y-2">
        <Textarea
          placeholder="Add a note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isPending || body.trim().length === 0}
          >
            {isPending ? "Adding…" : "Add note"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
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
