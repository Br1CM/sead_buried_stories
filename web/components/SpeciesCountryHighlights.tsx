import Image from "next/image";
import Link from "next/link";
import type { SpeciesIndexEntry } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SpeciesCountryHighlights({ species }: { species: SpeciesIndexEntry[] }) {
  const top10 = [...species].sort((a, b) => b.n_countries - a.n_countries).slice(0, 10);

  return (
    <div className="mb-10">
      <h2 className="text-sm uppercase tracking-wide text-ink-40">
        The most well-traveled species
      </h2>
      <p className="mt-1 text-sm text-ink-50">
        These turned up in the most different countries &mdash; likely stowaways of trade
        and travel rather than homebodies.
      </p>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {top10.map((s, i) => (
          <Link
            key={s.taxon_id}
            href={`/species/${s.taxon_id}`}
            className="group flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-ink-10 bg-ink-3 transition-colors hover:border-accent/60"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-ink-5">
              {s.image ? (
                <Image
                  src={s.image.url}
                  alt={s.common_name_en ?? s.scientific_name}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-soft/30 to-accent/10 text-xl font-semibold text-ink-30">
                  {initials(s.scientific_name)}
                </div>
              )}
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[11px] font-medium text-accent">
                {i + 1}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-2.5">
              <span className="truncate text-xs font-medium">
                {s.common_name_en ?? s.common_name_local ?? s.scientific_name}
              </span>
              <span className="text-[11px] text-ink-40">{s.n_countries} countries</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
