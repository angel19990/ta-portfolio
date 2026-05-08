// Seed dev classes + sections for Phase 3 Task 2.
// Idempotent: safely re-runnable. Looks up existing rows by name / section_code
// and only inserts what's missing.
//
// Run with:  node --env-file=.env.local scripts/seed-classes.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CLASSES = [
  { name: "Voice 1",     code: "V1",  level: "Foundations",  default_price_cents: 50000 },
  { name: "Chekhov 1",   code: "CH1", level: "Intermediate", default_price_cents: 65000 },
  { name: "Scene Study", code: "SS",  level: "Scene Study",  default_price_cents: 65000 },
];

// section_code convention: <CLASS><AM|PM>-<TERM>-<TEACHER_INITIAL+LAST_NAME>
// e.g. V1PM-FA25-MDiGeorge => Voice 1, PM slot, Fall 2025, Marco DiGeorge
const SECTIONS = [
  { class_name: "Voice 1",     section_code: "V1PM-FA25-MDiGeorge",  term: "FA25", price_cents: 50000 },
  { class_name: "Chekhov 1",   section_code: "CH1AM-FA25-RMauss",    term: "FA25", price_cents: 65000 },
  { class_name: "Scene Study", section_code: "SSPM-FA25-DClark",     term: "FA25", price_cents: 65000 },
];

const TERM_DATES = {
  FA25: { start_date: "2025-09-08", end_date: "2025-12-13" },
};

async function upsertClasses() {
  const names = CLASSES.map((c) => c.name);
  const { data: existing, error } = await supabase
    .from("classes")
    .select("id, name")
    .in("name", names);
  if (error) throw error;

  const existingByName = new Map((existing ?? []).map((c) => [c.name, c.id]));
  const toInsert = CLASSES.filter((c) => !existingByName.has(c.name));

  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("classes")
      .insert(toInsert)
      .select("id, name");
    if (insertError) throw insertError;
    for (const row of inserted ?? []) existingByName.set(row.name, row.id);
    console.log(`✓ Inserted ${inserted?.length ?? 0} class catalog rows`);
  } else {
    console.log("· All catalog classes already exist, skipping");
  }

  return existingByName;
}

async function upsertSections(classIdByName) {
  const codes = SECTIONS.map((s) => s.section_code);
  const { data: existing, error } = await supabase
    .from("class_sections")
    .select("id, section_code")
    .in("section_code", codes);
  if (error) throw error;

  const existingCodes = new Set((existing ?? []).map((s) => s.section_code));
  const toInsert = SECTIONS.filter((s) => !existingCodes.has(s.section_code)).map(
    (s) => {
      const class_id = classIdByName.get(s.class_name);
      if (!class_id) throw new Error(`No class id for ${s.class_name}`);
      const dates = TERM_DATES[s.term] ?? {};
      return {
        class_id,
        section_code: s.section_code,
        term: s.term,
        price_cents: s.price_cents,
        start_date: dates.start_date ?? null,
        end_date: dates.end_date ?? null,
      };
    },
  );

  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("class_sections")
      .insert(toInsert)
      .select("section_code");
    if (insertError) throw insertError;
    console.log(`✓ Inserted ${inserted?.length ?? 0} sections`);
  } else {
    console.log("· All sections already exist, skipping");
  }
}

console.log("Seeding classes + sections…");
const classIdByName = await upsertClasses();
await upsertSections(classIdByName);
console.log("Done.");
