"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type ActionResult } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Variant = "student" | "industry" | "admin";

const COPY: Record<Variant, { title: string; subtitle: string }> = {
  student: {
    title: "Student sign in",
    subtitle: "Access your talent profile and casting calls.",
  },
  industry: {
    title: "Industry sign in",
    subtitle: "Browse approved talent and manage casting calls.",
  },
  admin: {
    title: "Admin sign in",
    subtitle: "Manage students, classes, and casting calls.",
  },
};

export function LoginForm({ variant }: { variant: Variant }) {
  const [state, action, pending] = useActionState<
    ActionResult | undefined,
    FormData
  >(signIn, undefined);
  const copy = COPY[variant];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>
      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/reset-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {state?.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
