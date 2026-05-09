"use client"

import { useMemo, useState } from "react"
import Image from "next/image"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { AdminStudent, StudentStatus } from "@/lib/db/students"
import type { AvailableSection } from "@/lib/db/student-classes"
import { StudentSidePanel } from "@/components/admin/StudentSidePanel"
import { InviteUserDialog } from "@/components/admin/InviteUserDialog"

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

type StatusFilter = "all" | StudentStatus

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "private", label: "Private" },
  { value: "inactive", label: "Inactive" },
]

type Props = {
  students: AdminStudent[]
  sections: AvailableSection[]
}

export function StudentTable({ students, sections }: Props) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      if (filter !== "all" && s.status !== filter) return false
      if (!q) return true
      return (
        (s.full_name ?? "").toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      )
    })
  }, [students, query, filter])

  const counts = useMemo(() => {
    const out: Record<StatusFilter, number> = {
      all: students.length,
      inactive: 0,
      pending_approval: 0,
      approved: 0,
      private: 0,
    }
    for (const s of students) out[s.status] += 1
    return out
  }, [students])

  const selected = selectedId
    ? students.find((s) => s.id === selectedId) ?? null
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            type="search"
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            + Invite
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              type="button"
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-70">
                {counts[f.value]}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44px]" />
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {students.length === 0
                    ? "No students yet. Invite one to get started."
                    : "No students match this filter."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "cursor-pointer",
                    selectedId === s.id && "bg-muted/50",
                  )}
                >
                  <TableCell>
                    <div className="relative size-8 overflow-hidden rounded-full border bg-muted">
                      {s.actor_profile?.headshot_url ? (
                        <Image
                          src={s.actor_profile.headshot_url}
                          alt={s.full_name ?? s.email}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {s.full_name ?? (
                      <span className="italic text-muted-foreground">
                        Unnamed
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status]}>
                      {STATUS_LABEL[s.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(s.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StudentSidePanel
        student={selected}
        sections={sections}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      />
      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}
