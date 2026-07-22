"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { SpeciesIndexEntry } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SpeciesPicker({ species }: { species: SpeciesIndexEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return species;
    return species.filter(
      (s) =>
        s.scientific_name.toLowerCase().includes(q) ||
        s.common_name_en?.toLowerCase().includes(q) ||
        s.common_name_local?.toLowerCase().includes(q)
    );
  }, [species, query]);

  return (
    <div>
      <input
        type="search"
        placeholder="Search by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-8 w-full max-w-sm rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-white/30 focus:border-accent"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((s) => (
          <Link
            key={s.taxon_id}
            href={`/species/${s.taxon_id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-accent/60"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
              {s.image ? (
                <Image
                  src={s.image.url}
                  alt={s.common_name_en ?? s.scientific_name}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-soft/30 to-accent/10 text-2xl font-semibold text-white/30">
                  {initials(s.scientific_name)}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 p-3">
              <span className="text-sm font-medium leading-tight">
                {s.common_name_en ?? s.common_name_local ?? s.scientific_name}
              </span>
              <span className="italic text-xs text-white/50">{s.scientific_name}</span>
              <span className="mt-1 text-[11px] text-white/40">
                {s.n_sites} sites in {s.n_countries} countries · {s.oldest_label} →{" "}
                {s.youngest_label}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-white/40 text-sm">No species match &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
