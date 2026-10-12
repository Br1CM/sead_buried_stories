"use client";

import { useEffect, useRef, useState } from "react";
import { TimberSpeciesMap } from "@/components/TimberSpeciesMap";
import { SpeciesCompositionChart } from "@/components/SpeciesCompositionChart";
import type { TimberSpeciesBucketDetail } from "@/lib/types";

export function TimberSpeciesExplorer({ buckets }: { buckets: TimberSpeciesBucketDetail[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((i) => {
        if (i >= buckets.length - 2) {
          setPlaying(false);
          return Math.max(buckets.length - 1, 0);
        }
        return i + 1;
      });
    }, 1100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, buckets.length]);

  const active = buckets[activeIndex];

  return (
    <div className="flex flex-col gap-6">
      <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-ink-10">
        <TimberSpeciesMap points={active?.points ?? []} />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-black transition-transform hover:scale-105"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(buckets.length - 1, 0)}
          step={1}
          value={activeIndex}
          onChange={(e) => {
            setPlaying(false);
            setActiveIndex(Number(e.target.value));
          }}
          className="w-full accent-accent"
        />
      </div>

      {active && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">{active.label}</span>
          <span className="text-ink-40">{active.n_samples} dated timbers this era</span>
        </div>
      )}

      <div className="rounded-2xl border border-ink-10 bg-ink-2 p-6">
        <h3 className="mb-4 text-sm uppercase tracking-wide text-ink-40">
          What species were being felled, era by era
        </h3>
        <SpeciesCompositionChart buckets={buckets} activeIndex={activeIndex} onChange={setActiveIndex} />
      </div>
    </div>
  );
}
