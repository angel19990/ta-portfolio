import Link from "next/link";

import { Badge } from "@/components/ui/badge";

type Props = {
  id: string;
  fullName: string | null;
  age: number | null;
  location: string | null;
  headshotUrl: string | null;
  skills: string[];
};

export function ActorCard({
  id,
  fullName,
  age,
  location,
  headshotUrl,
  skills,
}: Props) {
  const topSkills = skills.slice(0, 3);
  const remaining = skills.length - topSkills.length;

  return (
    <Link
      href={`/industry/talent/${id}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
        {headshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headshotUrl}
            alt={fullName ?? "Actor"}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No headshot
          </div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div>
          <p className="truncate text-sm font-medium">{fullName ?? "Unnamed"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[age != null ? `${age}` : null, location].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        {topSkills.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {topSkills.map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px]">
                {s}
              </Badge>
            ))}
            {remaining > 0 ? (
              <Badge variant="outline" className="text-[10px]">
                +{remaining}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
