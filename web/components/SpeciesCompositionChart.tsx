"use client";

import { useRef } from "react";
import { SPECIES_COLORS, SPECIES_OTHER_COLOR, speciesLabel } from "@/lib/speciesColors";
import type { TimberSpeciesBucketDetail } from "@/lib/types";

const KNOWN_SPECIES = Object.keys(SPECIES_COLORS); // fixed order: Tall, Ek, Gran

function foldComposition(composition: Record<string, number>) {
  const known = KNOWN_SPECIES.map((s) => ({ species: s, pct: composition[s] ?? 0 }));
  const other = Object.entries(composition)
    .filter(([s]) => !KNOWN_SPECIES.includes(s))
    .reduce((sum, [, pct]) => sum + pct, 0);
  return [...known, { species: "Other", pct: Math.round(other * 10) / 10 }];
}

interface Props {
  buckets: TimberSpeciesBucketDetail[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export function SpeciesCompositionChart({ buckets, activeIndex, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  function indexFromClientX(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const frac = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(buckets.length - 1, Math.floor(frac * buckets.length)));
  }

  function handleMove(clientX: number) {
    const i = indexFromClientX(clientX);
    if (i !== null) onChange(i);
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="flex h-40 cursor-pointer items-end gap-1 select-none"
        onMouseMove={(e) => handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
      >
        {buckets.map((b, i) => {
          const segments = foldComposition(b.composition);
          const isActive = i === activeIndex;
          return (
            <div
              key={b.bucket_start}
              className={`flex h-full flex-1 flex-col-reverse overflow-hidden rounded-sm transition-opacity ${
                isActive ? "opacity-100" : "opacity-50"
              }`}
              style={{ outline: isActive ? "2px solid var(--color-accent)" : "none" }}
            >
              {segments.map((seg) =>
                seg.pct > 0 ? (
                  <div
                    key={seg.species}
                    style={{
                      height: `${seg.pct}%`,
                      background: seg.species === "Other" ? SPECIES_OTHER_COLOR : SPECIES_COLORS[seg.species],
                    }}
                    className="w-full"
                  />
                ) : null
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-ink-40">
        Move your cursor across to glide through time
      </p>
      <div className="mt-1 flex justify-between text-[10px] text-ink-30">
        <span>{buckets[0]?.label.split(" - ")[0]}</span>
        <span>{buckets[buckets.length - 1]?.label.split(" - ")[1]}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {[...KNOWN_SPECIES, "Other"].map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs text-ink-50">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s === "Other" ? SPECIES_OTHER_COLOR : SPECIES_COLORS[s] }}
              aria-hidden
            />
            {s === "Other" ? "Other" : speciesLabel(s)}
          </span>
        ))}
      </div>
    </div>
  );
}
