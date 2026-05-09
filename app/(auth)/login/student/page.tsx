import { LoginForm } from "@/components/auth/LoginForm";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authed";

export default async function StudentLoginPage() {
  await redirectIfAuthenticated();
  return <LoginForm variant="student" />;
}
