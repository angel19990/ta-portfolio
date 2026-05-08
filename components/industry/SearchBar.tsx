import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  defaultValue?: string;
  action?: string;
};

// Server-rendered GET form. Submits ?q=… to the same page; state lives in the URL.
// Hit Enter or click "Search" — no client-side debounce in MVP.
export function SearchBar({ defaultValue = "", action = "/industry/talent" }: Props) {
  return (
    <form action={action} method="get" className="flex gap-2">
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search by name, bio, location, or skill"
        className="max-w-md"
      />
      <Button type="submit" size="sm">
        Search
      </Button>
      {defaultValue ? (
        <Button type="button" variant="ghost" size="sm" nativeButton={false} render={<a href={action}>Clear</a>} />
      ) : null}
    </form>
  );
}
