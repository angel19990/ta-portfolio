import { redirect } from "next/navigation";
import { getCurrentUser, type AppRole } from "./get-user";

export async function requireRole(role: AppRole) {
  const user = await getCurrentUser();
  if (!user) redirect("/login/student");
  if (user.role !== role) {
    const home: Record<AppRole, string> = {
      student: "/student/casting-calls",
      industry_user: "/",
      admin: "/admin",
    };
    redirect(home[user.role]);
  }
  return user;
}
