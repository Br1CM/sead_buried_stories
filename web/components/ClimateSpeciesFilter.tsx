"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ClimateChart } from "@/components/ClimateChart";
import { AttributionBadge } from "@/components/AttributionBadge";
import type { ClimatePoint, ClimateSpeciesIndexEntry } from "@/lib/types";

interface Props {
  allSeries: ClimatePoint[];
  speciesIndex: ClimateSpeciesIndexEntry[];
  speciesSeries: Record<number, ClimatePoint[]>;
}

export function ClimateSpeciesFilter({ allSeries, speciesIndex, speciesSeries }: Props) {
  const [selected, setSelected] = useState<ClimateSpeciesIndexEntry | null>(null);

  const series = selected ? speciesSeries[selected.taxon_id] ?? allSeries : allSeries;

  const caption = useMemo(() => {
    if (!selected) {
      return "Shaded band shows the spread across all beetle species present at each point; the line is the average estimated summer maximum. Estimates from fewer samples (thin ends of the record) are noisier.";
    }
    const name = selected.common_name_en ?? selected.scientific_name;
    return `Built only from samples where ${name} was present — still averaged across every species found alongside it in those layers, same method as the full record, just a narrower slice of it.`;
  }, [selected]);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelected(null)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
            selected === null
              ? "border-accent bg-accent text-black"
              : "border-ink-15 bg-ink-3 text-ink-70 hover:border-ink-30"
          }`}
        >
          All species
        </button>
        {speciesIndex.map((s) => {
          const isActive = selected?.taxon_id === s.taxon_id;
          const label = s.common_name_en ?? s.scientific_name;
          return (
            <button
              key={s.taxon_id}
              onClick={() => setSelected(s)}
              className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition-colors ${
                isActive
                  ? "border-accent bg-accent text-black"
                  : "border-ink-15 bg-ink-3 text-ink-70 hover:border-ink-30"
              }`}
            >
              <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-ink-10">
                {s.image && (
                  <Image src={s.image.url} alt={label} fill unoptimized className="object-cover" />
                )}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-ink-10 bg-ink-2 p-6">
        <ClimateChart series={series} />
        <p className="mt-4 text-xs text-ink-30">{caption}</p>
        {selected?.image && (
          <div className="mt-2">
            <AttributionBadge image={selected.image} />
          </div>
        )}
      </div>
    </div>
  );
}
