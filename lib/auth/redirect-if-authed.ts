import { redirect } from "next/navigation"
import { getCurrentUser, type AppRole } from "./get-user"

const ROLE_HOME: Record<AppRole, string> = {
  student: "/student/profile",
  industry_user: "/industry/casting-calls",
  admin: "/admin",
}

// Used at the root page and login pages to bounce already-signed-in users
// to their dashboard. Replaces the middleware-level role lookup (which
// previously fired on every request, not just these entry points).
export async function redirectIfAuthenticated() {
  const user = await getCurrentUser()
  if (user) redirect(ROLE_HOME[user.role])
}
