import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentTable } from "@/components/admin/StudentTable";
import { listStudentsForAdmin } from "@/lib/db/students";

export default async function AdminDashboardPage() {
  await requireRole("admin");
  const students = await listStudentsForAdmin();

  return (
    <>
      <PageHeader title="Admin dashboard" />
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-6">
          <StudentTable students={students} />
        </TabsContent>
        <TabsContent value="classes" className="mt-6">
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Classes table lands in Phase 3.
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
