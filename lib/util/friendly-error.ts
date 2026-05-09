import "server-only"

// Map raw Supabase / Postgres errors to user-facing copy. Without this,
// actions surfaced strings like 'new row violates row-level security policy
// for table "casting_applications"' or '23505' codes directly to the UI.
//
// Anything we can't translate falls back to a generic message — and we log
// the original so an operator can correlate.

type SupabaseLikeError = {
  code?: string | null
  message: string
  details?: string | null
  hint?: string | null
}

const CODE_MAP: Record<string, string> = {
  "23505": "Already exists.",
  "23503": "Referenced record not found.",
  "23514": "That value isn't allowed.",
  "42501": "You don't have permission to do that.",
  PGRST116: "Not found.",
}

const MESSAGE_PATTERNS: { pattern: RegExp; message: string }[] = [
  { pattern: /actor_photos limit \(6\)/i, message: "You can have at most 6 photos. Delete one first." },
  { pattern: /application status is final/i, message: "This application is final and can't be changed." },
  { pattern: /can only be changed by an admin/i, message: "Admins only." },
  { pattern: /id is immutable/i, message: "That field can't be changed." },
  { pattern: /admins only/i, message: "Admins only." },
]

export function friendlyError(
  err: SupabaseLikeError | { message?: string; code?: string },
  fallback = "Something went wrong",
): string {
  const code = "code" in err ? err.code ?? null : null
  const message = "message" in err ? err.message ?? "" : ""
  if (code && CODE_MAP[code]) return CODE_MAP[code]
  for (const { pattern, message: friendly } of MESSAGE_PATTERNS) {
    if (pattern.test(message)) return friendly
  }
  console.error("[supabase]", err)
  return fallback
}
