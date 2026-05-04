// One-off: invite the first admin user and seed their profile row.
// Run with:  node --env-file=.env.local scripts/seed-admin.mjs <email> "<full name>"
import { createClient } from "@supabase/supabase-js";

const [, , emailArg, ...nameParts] = process.argv;
const email = emailArg;
const fullName = nameParts.join(" ").trim() || null;

if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/seed-admin.mjs <email> \"<full name>\"");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`Inviting ${email} as admin…`);

const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
  redirectTo: `${siteUrl}/auth/callback?next=/create-password`,
  data: { full_name: fullName },
});

if (error) {
  console.error("Invite failed:", error.message);
  process.exit(1);
}

const userId = data.user?.id;
if (!userId) {
  console.error("No user id returned from invite");
  process.exit(1);
}

console.log(`Invite sent. User id: ${userId}`);

const { error: insertError } = await supabase.from("profiles").insert({
  id: userId,
  email,
  role: "admin",
  full_name: fullName,
  is_active: true,
});

if (insertError) {
  console.error("Profile insert failed:", insertError.message);
  console.error("You may need to insert manually with this id:", userId);
  process.exit(1);
}

console.log("✓ Profile row inserted with role=admin");
console.log("✓ Check your inbox for the invite link, then visit /create-password");
