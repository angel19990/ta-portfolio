import Image from "next/image";
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
import { MobileNav } from "@/components/layout/MobileNav";
import taLogo from "@/assets/ta-logo.png";

const ROLE_NAV: Record<AppRole, { label: string; href: string }[]> = {
  student: [
    { label: "Talent", href: "/" },
    { label: "Casting Calls", href: "/student/casting-calls" },
    { label: "Applications", href: "/student/applications" },
  ],
  industry_user: [
    { label: "Talent", href: "/" },
    { label: "Casting Calls", href: "/industry/casting-calls" },
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

// Shared styling for every navbar item so rest / hover / press / focus stay
// consistent across plain links, external links, and dropdown triggers.
const NAV_ITEM_CLASS =
  "rounded-md px-3 py-1.5 text-sm font-medium text-navbar-fg-muted transition-all hover:bg-white/10 hover:text-navbar-fg active:translate-y-px aria-expanded:bg-white/10 aria-expanded:text-navbar-fg outline-none focus-visible:ring-2 focus-visible:ring-white/30";

const PUBLIC_NAV: { label: string; href: string; external?: boolean }[] = [
  { label: "Our Talent", href: "/" },
  { label: "Our Studio", href: "https://truthfulacting.com", external: true },
];

const PUBLIC_SIGNIN: { label: string; href: string }[] = [
  { label: "Student", href: "/login/student" },
  { label: "Industry User", href: "/login/industry" },
  { label: "Admin", href: "/login/admin" },
];

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="bg-navbar-bg text-navbar-fg border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {user ? (
            <MobileNav items={ROLE_NAV[user.role]} />
          ) : (
            <MobileNav items={PUBLIC_NAV} signInOptions={PUBLIC_SIGNIN} />
          )}
          <Link
            href={user ? roleHome(user.role) : "/"}
            className="flex items-center gap-2"
          >
            <Image
              src={taLogo}
              alt="Truthful Acting Studios"
              height={36}
              width={150}
              priority
              className="h-9 w-auto"
            />
          </Link>
        </div>

        {user ? (
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {ROLE_NAV[user.role].map((item) => (
              <Link key={item.href} href={item.href} className={NAV_ITEM_CLASS}>
                {item.label}
              </Link>
            ))}
            <a
              href="https://truthfulacting.com"
              target="_blank"
              rel="noopener noreferrer"
              className={NAV_ITEM_CLASS}
            >
              Our Studio
            </a>
          </nav>
        ) : (
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            <Link href="/" className={NAV_ITEM_CLASS}>
              Our Talent
            </Link>
            <a
              href="https://truthfulacting.com"
              target="_blank"
              rel="noopener noreferrer"
              className={NAV_ITEM_CLASS}
            >
              Our Studio
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button type="button" className={NAV_ITEM_CLASS} />
                }
              >
                Sign In
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Sign in as</DropdownMenuLabel>
                </DropdownMenuGroup>
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
          </nav>
        )}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="size-9 p-0 text-navbar-fg hover:bg-white/10 hover:text-navbar-fg"
                />
              }
              aria-label={`Account: ${user.fullName ?? user.email}`}
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-white/15 text-navbar-fg text-xs">
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
              {user.role === "student" ? (
                <>
                  <DropdownMenuItem render={<Link href="/student/profile" />}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
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
    ? "/student/casting-calls"
    : role === "industry_user"
      ? "/"
      : "/admin";
}
