import Link from "next/link";
import { getCurrentUser, type AppRole } from "@/lib/auth/get-user";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNav } from "./MobileNav";

const ROLE_NAV: Record<AppRole, { label: string; href: string }[]> = {
  student: [
    { label: "Profile", href: "/student/profile" },
    { label: "Casting Calls", href: "/student/casting-calls" },
    { label: "Applications", href: "/student/applications" },
  ],
  industry_user: [
    { label: "Casting Calls", href: "/industry/casting-calls" },
    { label: "Talent", href: "/industry/talent" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Approvals", href: "/admin/approvals" },
    { label: "Casting Calls", href: "/admin/casting-calls" },
  ],
};

const ROLE_LABEL: Record<AppRole, string> = {
  student: "Student",
  industry_user: "Industry",
  admin: "Admin",
};

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {user ? <MobileNav items={ROLE_NAV[user.role]} /> : null}
          <Link
            href={user ? roleHome(user.role) : "/"}
            className="flex items-center gap-2"
          >
            <span className="text-base font-semibold tracking-tight">
              Truthful Acting Studios
            </span>
          </Link>
        </div>

        {user ? (
          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 md:flex"
          >
            {ROLE_NAV[user.role].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
              Talent Network
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sign in as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/login/student" />}>
                Student
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/login/industry" />}>
                Industry User
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/login/admin" />}>
                Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="size-9 p-0" />}
              aria-label={`Account: ${user.fullName ?? user.email}`}
            >
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">
                  {initials(user.fullName ?? user.email)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user.fullName ?? "Account"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABEL[user.role]} · {user.email}
                  </span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <form action={signOut}>
                <DropdownMenuItem
                  nativeButton
                  render={<button type="submit" className="w-full" />}
                >
                  Sign out
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}

function initials(input: string) {
  const parts = input.split(/\s+|@/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

function roleHome(role: AppRole) {
  return role === "student"
    ? "/student/profile"
    : role === "industry_user"
      ? "/industry/casting-calls"
      : "/admin";
}
