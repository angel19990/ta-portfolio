import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function AdminDashboardPage() {
  await requireRole("admin");

  return (
    <>
      <PageHeader title="Admin dashboard" />
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-6">
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Students table lands in Phase 3.
          </div>
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
