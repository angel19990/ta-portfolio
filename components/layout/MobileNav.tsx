"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavItem = { label: string; href: string; external?: boolean }

type Props = {
  items: NavItem[]
  signInOptions?: NavItem[]
}

export function MobileNav({ items, signInOptions }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            className="md:hidden text-navbar-fg hover:bg-white/10 hover:text-navbar-fg"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-4 pb-4">
          {items.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ),
          )}
          {signInOptions ? (
            <>
              <div className="mt-4 border-t border-foreground/10 pt-3">
                <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Sign in as
                </p>
                {signInOptions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
