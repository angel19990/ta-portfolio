import { LoginForm } from "@/components/auth/LoginForm";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authed";

export default async function IndustryLoginPage() {
  await redirectIfAuthenticated();
  return <LoginForm variant="industry" />;
}
