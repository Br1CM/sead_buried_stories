"use client";

import Image from "next/image";
import { useState } from "react";
import { AttributionBadge } from "@/components/AttributionBadge";
import { LocatorMap } from "@/components/LocatorMap";
import type { TimberPreciseSample } from "@/lib/types";

function pickNext(current: number, total: number) {
  if (total <= 1) return 0;
  let next = Math.floor(Math.random() * total);
  while (next === current) next = Math.floor(Math.random() * total);
  return next;
}

export function TimberSpotlightCard({ samples }: { samples: TimberPreciseSample[] }) {
  const [index, setIndex] = useState(0);
  const s = samples[index];
  if (!s) return null;

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-ink-10 bg-ink-3">
      <div className="flex flex-col lg:flex-row">
        <div className="shrink-0 lg:w-1/2">
          <div className="relative h-72 w-full bg-black/30 sm:h-96 lg:h-full">
            {s.photo ? (
              <Image
                src={s.photo.url}
                alt={s.site_name}
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink-20">
                No photo of this building
              </div>
            )}
          </div>
          {s.photo && (
            <div className="px-4 py-2">
              <AttributionBadge image={s.photo} />
            </div>
          )}
        </div>

        <div className="flex-1 p-6">
          <div className="text-4xl font-semibold tracking-tight">
            {s.season_name}, {s.felling_year}
          </div>
          <div className="text-sm text-ink-40">{s.label}</div>

          <p className="mt-4 text-ink-80">
            A {s.species_en?.toLowerCase() ?? s.species_local ?? "tree"} felled at{" "}
            <span className="font-medium text-foreground">{s.site_name}</span>. Its bark was still
            attached when it was studied — the last ring it ever grew, still intact. That&rsquo;s
            what lets dendrochronologists name not just the year this tree came down, but the
            month.
          </p>

          <div className="mt-5 h-40 w-full overflow-hidden rounded-2xl border border-ink-10">
            <LocatorMap lat={s.lat} lon={s.lon} label={s.site_name} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIndex((i) => pickNext(i, samples.length))}
              className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-105"
            >
              Show me another
            </button>
            <a
              href={`https://browser.sead.se/site/${s.site_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-accent/60 px-5 py-2 text-sm text-accent-text transition-colors hover:bg-accent/10"
            >
              Explore this site in SEAD &#8599;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
