import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Allow only same-origin pathnames: must start with `/` followed by an
// alphanumeric/underscore/dash, blocking `//evil.com` and `/\evil.com` style
// open-redirect payloads.
const SAFE_NEXT_RE = /^\/[A-Za-z0-9_\-/][A-Za-z0-9_\-/?=&%.]*$/;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const safeNext = rawNext === "/" || SAFE_NEXT_RE.test(rawNext) ? rawNext : "/";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login/student?error=missing_code`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login/student?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
