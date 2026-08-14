"use client";

import Image from "next/image";
import { useState } from "react";
import type { SiteLayer, SiteLayerTaxon } from "@/lib/types";

function TaxonChip({ taxon }: { taxon: SiteLayerTaxon }) {
  const label = taxon.common_name_en ?? taxon.common_name_local ?? taxon.scientific_name;

  return (
    <span className="group relative">
      <span
        className="cursor-default rounded-full border border-ink-10 bg-ink-5 px-3 py-1 text-xs transition-colors group-hover:border-accent/50"
        title={taxon.scientific_name}
      >
        {label}
      </span>

      {taxon.image && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-36 -translate-x-1/2 rounded-xl border border-cream-10 bg-overlay p-2 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          <span className="relative block h-24 w-full overflow-hidden rounded-lg bg-cream-5">
            <Image
              src={taxon.image.url}
              alt={label}
              fill
              unoptimized
              className="object-cover"
            />
          </span>
          <span className="mt-1 block truncate text-center text-[11px] text-cream-70">
            {taxon.scientific_name}
          </span>
        </span>
      )}
    </span>
  );
}

export function SiteDig({ layers }: { layers: SiteLayer[] }) {
  // Displayed youngest (surface) first, descending toward the oldest (deepest) layer,
  // matching how a real excavation profile reads top-to-bottom.
  const ordered = [...layers].sort((a, b) => a.age_older_bp - b.age_older_bp);
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="relative flex flex-col">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-10" aria-hidden />
      {ordered.map((layer, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="relative flex gap-4 pb-4">
            <div className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-overlay text-xs text-accent">
              {i + 1}
            </div>
            <div className="flex-1 rounded-2xl border border-ink-10 bg-ink-3 p-4">
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-left"
              >
                <span className="font-medium">{layer.label}</span>
                <span className="text-sm text-ink-40">{layer.n_taxa} species identified</span>
              </button>
              {isOpen && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {layer.taxa.map((t, ti) => (
                    <TaxonChip key={ti} taxon={t} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
