"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

type Props = {
  defaultValue?: string;
};

// URL is the source of truth (?q=). Internal `value` is the controlled input;
// it syncs to the URL on a 250ms debounce. router.replace keeps Back/Forward
// usable without polluting history.
export function SearchBar({ defaultValue = "" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track which router.replace call we last fired so we don't run an unnecessary
  // round-trip when the user types the same text back in.
  const lastPushedRef = useRef<string>(defaultValue);

  useEffect(() => {
    if (value === lastPushedRef.current) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
      lastPushedRef.current = value;
    }, 250);
    return () => clearTimeout(timer);
  }, [value, router, searchParams]);

  return (
    <div className="relative max-w-md">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by name, bio, location, or skill"
        aria-label="Search talent"
        className="h-11 w-full rounded-full border border-input bg-background pl-11 pr-11 text-sm shadow-xs outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 outline-none"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
