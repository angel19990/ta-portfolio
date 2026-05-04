// One-off: delete an auth user by email (cascades to profiles via FK).
// Run with:  node --env-file=.env.local scripts/delete-user.mjs <email>
import { createClient } from "@supabase/supabase-js";

const [, , email] = process.argv;
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/delete-user.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let user = null;
let page = 1;
while (!user) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("listUsers failed:", error.message);
    process.exit(1);
  }
  user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (user) break;
  if (data.users.length < 200) break;
  page += 1;
}

if (!user) {
  console.error(`No user found with email ${email}`);
  process.exit(1);
}

console.log(`Deleting user ${email} (id ${user.id})…`);
const { error } = await supabase.auth.admin.deleteUser(user.id);
if (error) {
  console.error("deleteUser failed:", error.message);
  process.exit(1);
}

console.log(`✓ User ${email} deleted (profile row cascaded)`);
