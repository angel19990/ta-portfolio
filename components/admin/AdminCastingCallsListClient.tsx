"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { AdminCastingCallSidePanel } from "@/components/admin/AdminCastingCallSidePanel"
import type { AdminCastingCallRow } from "@/lib/db/casting-calls"
import {
  CASTING_CALL_STATUS_LABEL as STATUS_LABEL,
  CASTING_CALL_STATUS_VARIANT as STATUS_VARIANT,
} from "@/lib/ui/status-variants"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type Props = {
  calls: AdminCastingCallRow[]
}

export function AdminCastingCallsListClient({ calls }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId
    ? calls.find((c) => c.id === selectedId) ?? null
    : null

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applicants</TableHead>
            <TableHead className="text-right">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((c) => (
            <TableRow
              key={c.id}
              className={cn(selectedId === c.id && "bg-muted/50")}
            >
              <TableCell>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className="text-left hover:underline focus:outline-none focus-visible:underline"
                >
                  <span className="font-medium">{c.title}</span>
                  {c.production_company ? (
                    <p className="text-xs text-muted-foreground">
                      {c.production_company}
                    </p>
                  ) : null}
                </button>
              </TableCell>
              <TableCell className="text-sm">
                {c.owner_full_name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[c.status]}>
                  {STATUS_LABEL[c.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{c.applicant_count}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatDate(c.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AdminCastingCallSidePanel
        call={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      />
    </>
  )
}
