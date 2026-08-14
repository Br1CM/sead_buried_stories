"use client";

import { useEffect, useRef, useState } from "react";
import type { SpeciesPathStop } from "@/lib/types";

interface TimelineProps {
  stops: SpeciesPathStop[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export function Timeline({ stops, activeIndex, onChange }: TimelineProps) {
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      onChange(activeIndex >= stops.length - 1 ? 0 : activeIndex + 1);
    }, 1200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, activeIndex, stops.length]);

  useEffect(() => {
    if (activeIndex >= stops.length - 1) setPlaying(false);
  }, [activeIndex, stops.length]);

  const active = stops[activeIndex];

  return (
    <div className="flex flex-col gap-3">
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
          max={Math.max(stops.length - 1, 0)}
          step={1}
          value={activeIndex}
          onChange={(e) => {
            setPlaying(false);
            onChange(Number(e.target.value));
          }}
          className="w-full accent-accent"
        />
      </div>
      {active && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">{active.site_name}</span>
          <span className="text-ink-50">{active.label}</span>
          <span className="text-ink-40">
            stop {activeIndex + 1} of {stops.length} · {active.n_finds} finds here
          </span>
        </div>
      )}
    </div>
  );
}
