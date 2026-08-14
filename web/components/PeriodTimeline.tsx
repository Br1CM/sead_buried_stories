"use client";

import type { CeramicsPeriodSummary } from "@/lib/types";

interface PeriodTimelineProps {
  periods: CeramicsPeriodSummary[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export function PeriodTimeline({ periods, activeIndex, onChange }: PeriodTimelineProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {periods.map((p, i) => (
        <button
          key={p.slug}
          onClick={() => onChange(i)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
            i === activeIndex
              ? "border-accent bg-accent text-black"
              : "border-ink-15 bg-ink-3 text-ink-70 hover:border-ink-30"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
