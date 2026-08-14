"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { TimberRingsIndexEntry } from "@/lib/types";

export function TimberRingsPicker({ buildings }: { buildings: TimberRingsIndexEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter((b) => b.site_name.toLowerCase().includes(q));
  }, [buildings, query]);

  return (
    <div>
      <input
        type="search"
        placeholder="Search by building name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-8 w-full max-w-sm rounded-full border border-ink-15 bg-ink-5 px-4 py-2 text-sm outline-none placeholder:text-ink-30 focus:border-accent"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((b) => (
          <Link
            key={b.site_id}
            href={`/timber/rings/${b.site_id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-ink-10 bg-ink-3 transition-colors hover:border-accent/60"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-5">
              {b.photo ? (
                <Image
                  src={b.photo.url}
                  alt={b.site_name}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-soft/30 to-accent/10 text-2xl font-semibold text-ink-30">
                  {b.site_name[0]}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 p-3">
              <span className="text-sm font-medium leading-tight">{b.site_name}</span>
              <span className="text-[11px] text-ink-40">
                {b.n_years} dated years · {b.earliest_label} &rarr; {b.latest_label}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-ink-40">No buildings match &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
