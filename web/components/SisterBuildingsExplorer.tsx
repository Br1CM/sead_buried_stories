"use client";

import Image from "next/image";
import { useState } from "react";
import { AttributionBadge } from "@/components/AttributionBadge";
import { SisterBuildingsMap } from "@/components/SisterBuildingsMap";
import { speciesLabel } from "@/lib/speciesColors";
import type { ProvenanceShape, SisterCluster } from "@/lib/types";

export function SisterBuildingsExplorer({
  clusters,
  shapes,
}: {
  clusters: SisterCluster[];
  shapes: Record<string, ProvenanceShape>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = clusters[activeIndex];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {clusters.map((c, i) => (
          <button
            key={`${c.provenance}-${c.year_bucket}`}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              i === activeIndex
                ? "border-accent bg-accent text-black"
                : "border-ink-15 bg-ink-3 text-ink-70 hover:border-ink-30"
            }`}
          >
            {c.provenance} &middot; {c.label}
          </button>
        ))}
      </div>

      {active && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-xl font-medium">
              Timber from {active.provenance}, around {active.label}
            </h2>
            <span className="text-sm text-ink-40">
              {active.n_sites} buildings &middot; up to {active.max_distance_km} km away
            </span>
          </div>

          <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-ink-10">
            <SisterBuildingsMap cluster={active} shape={shapes[active.provenance]} />
          </div>
          {shapes[active.provenance]?.kind === "approx_circle" && (
            <p className="text-xs text-ink-40">
              &ldquo;{active.provenance}&rdquo; isn&apos;t an official province &mdash; the dashed outline is an
              approximate area, not a real boundary.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.sites.map((s) => (
              <a
                key={s.site_id}
                href={`https://browser.sead.se/site/${s.site_id}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.site_name} — open in the SEAD browser`}
                className="group block overflow-hidden rounded-2xl border border-ink-10 bg-ink-3 transition-colors hover:border-accent/60"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-5">
                  {s.photo ? (
                    <Image
                      src={s.photo.url}
                      alt={s.site_name}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-20">
                      No photo
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium">{s.site_name}</div>
                  <div className="mt-0.5 text-xs text-ink-50">
                    {s.label}
                    {s.species_local && ` · ${speciesLabel(s.species_local)}`}
                  </div>
                  <div className="text-xs text-accent-text">{s.distance_km} km from {active.provenance}</div>
                  {s.photo && (
                    <div className="mt-1">
                      <AttributionBadge image={s.photo} />
                    </div>
                  )}
                  <div className="mt-2 text-xs text-accent-text opacity-70 transition-opacity group-hover:opacity-100">
                    Explore this site in SEAD &#8599;
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
