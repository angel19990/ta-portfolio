import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <span className="text-base font-semibold tracking-tight">
            Truthful Acting Studios
          </span>
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
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Truthful Acting Studios
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          A home for our students, the industry that hires them, and the team
          that supports them.
        </p>
        <div className="mt-8 flex gap-3">
          <Button nativeButton={false} render={<Link href="/login/student" />}>
            Student sign in
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/login/industry" />}
          >
            Industry sign in
          </Button>
        </div>
      </main>
    </div>
  );
}
