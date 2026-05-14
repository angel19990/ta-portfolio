import Image from "next/image";

import { transformedImage } from "@/lib/util/storage-image";

type Props = {
  fullName: string | null;
  location: string | null;
  headshotUrl: string | null;
  skills: string[];
  onSelect: () => void;
};

export function ActorCard({
  fullName,
  location,
  headshotUrl,
  skills,
  onSelect,
}: Props) {
  const topSkills = skills.slice(0, 3);
  const remaining = skills.length - topSkills.length;
  const transformed = transformedImage(headshotUrl, { width: 600 });

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group block w-full overflow-hidden rounded-lg bg-card text-left outline-none ring-1 ring-foreground/5 transition hover:ring-foreground/15 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/50"
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
      <div className="space-y-1 p-3">
        <div className="space-y-0.5">
          <p className="truncate text-[15px] font-semibold tracking-tight leading-snug">
            {fullName ?? "Unnamed"}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {location || "—"}
          </p>
        </div>
        {topSkills.length > 0 ? (
          <p className="truncate text-xs text-muted-foreground">
            {topSkills.join(" · ")}
            {remaining > 0 ? ` · +${remaining}` : ""}
          </p>
        ) : null}
      </div>
    </button>
  );
}
