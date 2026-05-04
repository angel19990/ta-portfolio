import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type AppRole = "student" | "industry_user" | "admin";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/auth",
  "/create-password",
  "/reset-password",
];
const ROLE_HOME: Record<AppRole, string> = {
  student: "/student/profile",
  industry_user: "/industry/casting-calls",
  admin: "/admin",
};

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
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as AppRole | undefined;

    if (role) {
      const inWrongSection =
        (pathname.startsWith("/student") && role !== "student") ||
        (pathname.startsWith("/industry") && role !== "industry_user") ||
        (pathname.startsWith("/admin") && role !== "admin");

      if (inWrongSection) {
        const url = request.nextUrl.clone();
        url.pathname = ROLE_HOME[role];
        return NextResponse.redirect(url);
      }

      if (pathname === "/" || pathname.startsWith("/login")) {
        const url = request.nextUrl.clone();
        url.pathname = ROLE_HOME[role];
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
