"use client";

import { useState } from "react";
import { PeriodTimeline } from "@/components/PeriodTimeline";
import { CeramicsMap } from "@/components/CeramicsMap";
import { TemperChart } from "@/components/TemperChart";
import type { CeramicsPeriodDetail } from "@/lib/types";

export function CeramicsExplorer({ periods }: { periods: CeramicsPeriodDetail[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = periods[activeIndex];

  return (
    <div className="flex flex-col gap-6">
      <PeriodTimeline periods={periods} activeIndex={activeIndex} onChange={setActiveIndex} />

      {active && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-xl font-medium">{active.name}</h2>
            <span className="text-sm text-white/50">{active.label_range}</span>
            <span className="text-sm text-white/40">
              {active.n_sites} sites · {active.n_samples} pottery samples analysed
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-[360px] overflow-hidden rounded-2xl border border-white/10">
              <CeramicsMap sites={active.sites} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="mb-4 text-sm uppercase tracking-wide text-white/40">
                What potters tempered their clay with
              </h3>
              <TemperChart temper={active.temper} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
