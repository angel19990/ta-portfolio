import { requireRole } from "@/lib/auth/require-role"
import { listAllCastingCallsForAdmin } from "@/lib/db/casting-calls"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminCastingCallRow } from "@/components/admin/AdminCastingCallRow"

export default async function AdminCastingCallsPage() {
  await requireRole("admin")
  const calls = await listAllCastingCallsForAdmin()

  return (
    <>
      <PageHeader
        title="Casting calls"
        description="Every call across the network. Archive force-removes a call from the platform."
      />
      {calls.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No casting calls yet.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applicants</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((c) => (
              <AdminCastingCallRow key={c.id} call={c} />
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
