import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/talent",
  "/login",
  "/auth",
  "/create-password",
  "/reset-password",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Auth check only — no profile/role lookup. Per-role authorization is
  // handled by `requireRole` in each role-segment page (which is React
  // `cache()`-deduped, so it's one DB hit per request, not two like the
  // old middleware + page double-fetch). Sending authed users to their
  // home from `/` and `/login` is handled by `redirectIfAuthenticated`
  // on those specific pages.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login/student";
    return NextResponse.redirect(url);
  }

  return response;
}
