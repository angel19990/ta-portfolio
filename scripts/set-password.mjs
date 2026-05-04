// One-off: set a user's password via the service role.
// Run with:  node --env-file=.env.local scripts/set-password.mjs <email> <password>
import { createClient } from "@supabase/supabase-js";

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error(
    'Usage: node --env-file=.env.local scripts/set-password.mjs <email> <password>',
  );
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

// Find user by email — paginate listUsers to be safe.
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

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
});

if (error) {
  console.error("updateUserById failed:", error.message);
  process.exit(1);
}

console.log(`✓ Password set for ${email} (id ${user.id})`);
console.log("✓ Email confirmed");
