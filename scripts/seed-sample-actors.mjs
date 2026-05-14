// One-off: seed five fully-approved sample actors with headshots so the
// talent grid has more than one face to show. Idempotent — re-running skips
// any actor whose email already has a profile row.
//
// Run with:
//   node --env-file=.env.local scripts/seed-sample-actors.mjs
//
// Cleanup any sample actor:
//   node --env-file=.env.local scripts/delete-user.mjs hello+sofia@angelikacheng.com
//
// Each sample uses a hello+<slug>@angelikacheng.com address (Gmail alias)
// so they all land in the same inbox if email ever fires.

import { createClient } from "@supabase/supabase-js";
import { readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = join(__dirname, "..", "assets", "sample-photos");

const SAMPLES = [
  {
    email: "hello+sofia@angelikacheng.com",
    fullName: "Sofia Reyes",
    location: "Orlando, FL",
    ethnicity: "Hispanic or Latino",
    bio:
      "Trained in Meisner since 2023. Drawn to character work where vulnerability " +
      "lives just under the surface. Currently working on a one-woman show about her " +
      "grandmother's emigration from Bogotá.",
    skills: ["Meisner Technique", "Stage Combat", "Improv", "Spanish"],
    current_job: "Server at Ravenous Pig",
    favorite_movies: "La La Land, Past Lives, Mulholland Drive",
    favorite_series: "Fleabag, Severance",
    photo: "close-up-of-a-beautiful-smiling-young-woman-walkin-2026-03-19-04-24-18-utc.jpg",
  },
  {
    email: "hello+marcus@angelikacheng.com",
    fullName: "Marcus Halloran",
    location: "Brooklyn, NY",
    ethnicity: "White",
    bio:
      "Classically trained at LAMDA. Recent work in indie horror and prestige " +
      "limited series. Equally drawn to Pinter and to whatever Yorgos Lanthimos " +
      "is making next.",
    skills: ["Voice Acting", "Stage Combat", "Period Drama", "Dialects"],
    current_job: "Audiobook narrator (freelance)",
    favorite_movies: "Phantom Thread, There Will Be Blood, In Bruges",
    favorite_series: "Succession, The Bear",
    photo: "germany-bavaria-munich-man-leaning-against-lamp-2026-03-09-05-46-07-utc.jpg",
  },
  {
    email: "hello+naomi@angelikacheng.com",
    fullName: "Naomi Patel",
    location: "Atlanta, GA",
    ethnicity: "Asian",
    bio:
      "Versatile on-camera presence with a background in advertising. Loves " +
      "commercial work and the discipline of finding the truth in fifteen seconds. " +
      "Currently shooting a national insurance campaign.",
    skills: ["Commercial", "Improv", "On-camera", "Hindi"],
    current_job: "Brand strategist at Ogilvy",
    favorite_movies: "The Farewell, Everything Everywhere All At Once",
    favorite_series: "Beef, Reservation Dogs",
    photo: "smiling-woman-in-gray-cardigan-poses-in-office-2026-03-19-23-44-35-utc.JPG",
  },
  {
    email: "hello+ethan@angelikacheng.com",
    fullName: "Ethan Park",
    location: "Chicago, IL",
    ethnicity: "Asian",
    bio:
      "Sketch comedy and on-camera improv. Trained at Second City and Truthful " +
      "Acting Studios. Recently joined the cast of a touring sketch revue.",
    skills: ["Comedy", "Improv", "Sketch", "Korean"],
    current_job: "Substitute teacher",
    favorite_movies: "Hot Fuzz, Burn After Reading, Eighth Grade",
    favorite_series: "I Think You Should Leave, Detroiters",
    photo: "smiling-young-man-in-blue-shirt-portrait-2026-03-26-06-50-13-utc.JPG",
  },
  {
    email: "hello+daniel@angelikacheng.com",
    fullName: "Daniel Quinn",
    location: "Austin, TX",
    ethnicity: "White",
    bio:
      "Singer-songwriter turned actor. Currently developing a short film about " +
      "touring musicians. Drawn to indie projects with strong original soundtracks.",
    skills: ["Indie Film", "Period Drama", "Music", "Guitar"],
    current_job: "Studio musician",
    favorite_movies: "Inside Llewyn Davis, Once, The Rider",
    favorite_series: "Atlanta, Mr. Robot",
    photo: "young-man-poses-in-natural-light-outdoors-2026-03-25-03-59-31-utc.jpg",
  },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// crypto.randomBytes-style password good enough for service-managed accounts.
function randomPassword(len = 24) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function mimeForFile(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  throw new Error(`Unsupported headshot extension: ${name}`);
}

async function seedOne(sample) {
  console.log(`\n→ ${sample.fullName} <${sample.email}>`);

  // 1. Skip if a profile already exists for this email (idempotent).
  const { data: existing, error: existingErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", sample.email)
    .maybeSingle();
  if (existingErr) {
    console.error("  ✗ profile lookup failed:", existingErr.message);
    return;
  }
  if (existing) {
    console.log("  · already seeded, skipping");
    return;
  }

  // 2. Read headshot file. Failing early avoids a half-seeded user.
  const photoPath = join(PHOTOS_DIR, sample.photo);
  try {
    await stat(photoPath);
  } catch {
    console.error(`  ✗ missing headshot file: ${photoPath}`);
    return;
  }
  const photoBuf = await readFile(photoPath);
  const mime = mimeForFile(sample.photo);

  // 3. Create the auth user (auto-confirmed; no email send).
  const password = randomPassword();
  const { data: created, error: createErr } =
    await supabase.auth.admin.createUser({
      email: sample.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: sample.fullName },
    });
  if (createErr || !created.user) {
    console.error("  ✗ auth.admin.createUser failed:", createErr?.message);
    return;
  }
  const userId = created.user.id;

  // 4. Insert profiles row.
  const { error: profileErr } = await supabase.from("profiles").insert({
    id: userId,
    email: sample.email,
    role: "student",
    full_name: sample.fullName,
    is_active: true,
  });
  if (profileErr) {
    console.error("  ✗ profiles insert failed:", profileErr.message);
    await supabase.auth.admin.deleteUser(userId);
    return;
  }

  // 5. Upload headshot at the canonical path the app uses (`{userId}/headshot-*.ext`).
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const storagePath = `${userId}/headshot-${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("headshots")
    .upload(storagePath, photoBuf, { contentType: mime, upsert: false });
  if (uploadErr) {
    console.error("  ✗ storage upload failed:", uploadErr.message);
    await supabase.auth.admin.deleteUser(userId);
    return;
  }
  const { data: pub } = supabase.storage
    .from("headshots")
    .getPublicUrl(storagePath);
  const headshotUrl = pub.publicUrl;

  // 6. Insert actor_profiles row, already public + approved.
  //    The approval trigger only fires on UPDATE — setting approved_at on
  //    INSERT under the service-role client is fine.
  const { error: actorErr } = await supabase.from("actor_profiles").insert({
    profile_id: userId,
    headshot_url: headshotUrl,
    location: sample.location,
    ethnicity: sample.ethnicity,
    bio: sample.bio,
    skills: sample.skills,
    current_job: sample.current_job,
    favorite_movies: sample.favorite_movies,
    favorite_series: sample.favorite_series,
    visibility: "public",
    approved_at: new Date().toISOString(),
  });
  if (actorErr) {
    console.error("  ✗ actor_profiles insert failed:", actorErr.message);
    await supabase.storage.from("headshots").remove([storagePath]);
    await supabase.auth.admin.deleteUser(userId);
    return;
  }

  console.log(`  ✓ seeded (id ${userId})`);
}

console.log(`Seeding ${SAMPLES.length} sample actor(s) from ${PHOTOS_DIR}`);
for (const sample of SAMPLES) {
  await seedOne(sample);
}
console.log("\nDone.");
