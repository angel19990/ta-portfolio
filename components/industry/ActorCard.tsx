import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { transformedImage } from "@/lib/util/storage-image";

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
  const transformed = transformedImage(headshotUrl, { width: 600 });

  return (
    <Link
      href={`/industry/talent/${id}`}
      className="group block overflow-hidden rounded-lg border bg-card outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {transformed ? (
          <Image
            src={transformed}
            alt={fullName ?? "Actor"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
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
