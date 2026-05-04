import { redirect } from "next/navigation";
import { CreatePasswordForm } from "@/components/auth/CreatePasswordForm";

export default async function CreatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error_description?: string }>;
}) {
  const { code, error_description } = await searchParams;

  // If the invite/recovery email landed here directly with a ?code,
  // hand it to the route handler so it can set cookies properly.
  if (code) {
    redirect(`/auth/callback?code=${code}&next=/create-password`);
  }

  return (
    <>
      {error_description ? (
        <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error_description}
        </p>
      ) : null}
      <CreatePasswordForm />
    </>
  );
}
