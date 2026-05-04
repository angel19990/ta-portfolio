import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "student" | "industry_user" | "admin";

export type AppUser = {
  id: string;
  email: string;
  role: AppRole;
  fullName: string | null;
};

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: profile.email,
    role: profile.role as AppRole,
    fullName: profile.full_name,
  };
});
