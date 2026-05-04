// Generate a fresh invite or magic link for a user without sending email.
// Run with:  node --env-file=.env.local scripts/generate-invite-link.mjs <email> [type]
// type: invite (default) | magiclink | recovery
import { createClient } from "@supabase/supabase-js";

const [, , email, typeArg] = process.argv;
const type = typeArg || "invite";
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/generate-invite-link.mjs <email> [invite|magiclink|recovery]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.generateLink({
  type,
  email,
  options: {
    redirectTo: `${siteUrl}/auth/callback?next=/create-password`,
  },
});

if (error) {
  console.error("generateLink failed:", error.message);
  process.exit(1);
}

console.log("Generated link:");
console.log(data.properties?.action_link);
