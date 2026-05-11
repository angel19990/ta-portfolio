"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

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
import type { AdminClassRow } from "@/lib/db/classes"
import { ClassFormDialog } from "@/components/admin/ClassFormDialog"
import { ClassSidePanel } from "@/components/admin/ClassSidePanel"

type Props = {
  classes: AdminClassRow[]
}

export function ClassesTable({ classes }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newClassOpen, setNewClassOpen] = useState(false)

  const selected = selectedId
    ? classes.find((c) => c.id === selectedId) ?? null
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {classes.length} {classes.length === 1 ? "class" : "classes"} in the catalog
        </p>
        <Button type="button" size="sm" onClick={() => setNewClassOpen(true)}>
          + New class
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Default price</TableHead>
              <TableHead className="text-right">Sections</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No classes yet. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              classes.map((c) => (
                <TableRow
                  key={c.id}
                  className={cn(selectedId === c.id && "bg-muted/50")}
                >
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className="text-left hover:underline focus:outline-none focus-visible:underline"
                    >
                      {c.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.code ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.level ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCents(c.default_price_cents)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {c.section_count}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "secondary" : "outline"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClassSidePanel
        classRow={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        onAfterChange={() => router.refresh()}
      />
      <ClassFormDialog
        open={newClassOpen}
        onOpenChange={setNewClassOpen}
        onAfterSubmit={() => router.refresh()}
      />
    </div>
  )
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}
