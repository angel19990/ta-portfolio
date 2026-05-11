import { requireRole } from "@/lib/auth/require-role";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentTable } from "@/components/admin/StudentTable";
import { ClassesTable } from "@/components/admin/ClassesTable";
import { listStudentsForAdmin } from "@/lib/db/students";
import { listAvailableSections } from "@/lib/db/student-classes";
import { listClassesForAdmin } from "@/lib/db/classes";

export default async function AdminDashboardPage() {
  await requireRole("admin");
  const [students, sections, classes] = await Promise.all([
    listStudentsForAdmin(),
    listAvailableSections(),
    listClassesForAdmin(),
  ]);

  return (
    <>
      <PageHeader title="Admin dashboard" />
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-6">
          <StudentTable students={students} sections={sections} />
        </TabsContent>
        <TabsContent value="classes" className="mt-6">
          <ClassesTable classes={classes} />
        </TabsContent>
      </Tabs>
    </>
  );
}
