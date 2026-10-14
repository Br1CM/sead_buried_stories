"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { speciesColor, speciesLabel } from "@/lib/speciesColors";
import type { TimberRingYear } from "@/lib/types";

const SIZE = 440;
const CENTER = SIZE / 2;
const MAX_RADIUS = CENTER - 20;
const INNER_RADIUS = 22;

export function TimberRings({ years }: { years: TimberRingYear[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((i) => {
        if (i >= years.length - 2) {
          setPlaying(false);
          return Math.max(years.length - 1, 0);
        }
        return i + 1;
      });
    }, 900);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, years.length]);

  const revealed = years.slice(0, activeIndex + 1);
  const active = years[activeIndex];
  // Ring spacing scales to the building's own year count, so the outermost ring always
  // lands inside the canvas whether there are 6 dated years or 52.
  const ringGap = (MAX_RADIUS - INNER_RADIUS) / Math.max(years.length - 1, 1);

  const legend = useMemo(() => {
    const seen = new Set<string>();
    const items: { species: string; color: string }[] = [];
    for (const y of years) {
      for (const s of y.species_local) {
        if (!seen.has(s)) {
          seen.add(s);
          items.push({ species: s, color: speciesColor(s) });
        }
      }
    }
    return items;
  }, [years]);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="relative mx-auto shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
          <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 8} fill="var(--ink-4)" />
          {revealed.map((y, i) => {
            const radius = INNER_RADIUS + i * ringGap;
            const isActive = i === activeIndex;
            const color = speciesColor(y.species_local[0]);
            return (
              <circle
                key={y.year}
                cx={CENTER}
                cy={CENTER}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={isActive ? 3.5 : 1.6}
                opacity={isActive ? 1 : 0.55}
                className="cursor-pointer transition-all"
                onClick={() => {
                  setPlaying(false);
                  setActiveIndex(i);
                }}
              >
                <title>{`${y.label} — ${
                  y.species_local.map((s) => speciesLabel(s)).join(", ") || "unknown species"
                }`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold tracking-tight">{active?.label ?? "—"}</span>
          <span className="text-xs text-ink-40">
            ring {activeIndex + 1} of {years.length}
          </span>
        </div>
      </div>

      <div className="flex-1">
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
            max={Math.max(years.length - 1, 0)}
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
          <div className="mt-4 rounded-2xl border border-ink-10 bg-ink-3 p-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-lg font-medium">{active.label}</span>
              {active.has_waney && (
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] text-accent-text">
                  exact felling year
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-60">
              {active.n_samples} timber{active.n_samples === 1 ? "" : "s"} dated to this year
              {active.species_local.length > 0 && (
                <>
                  {" "}
                  &mdash;{" "}
                  {active.species_local.map((s) => speciesLabel(s)).join(", ")}
                </>
              )}
            </p>
          </div>
        )}

        {legend.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {legend.map((l) => (
              <span key={l.species} className="flex items-center gap-1.5 text-xs text-ink-50">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: l.color }}
                  aria-hidden
                />
                {speciesLabel(l.species)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
