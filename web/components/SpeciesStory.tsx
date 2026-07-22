"use client";

import { useState } from "react";
import { MapTrace } from "@/components/MapTrace";
import { Timeline } from "@/components/Timeline";
import type { SpeciesPathStop } from "@/lib/types";

export function SpeciesStory({ stops }: { stops: SpeciesPathStop[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-white/10">
        <MapTrace stops={stops} activeIndex={activeIndex} />
      </div>
      <Timeline stops={stops} activeIndex={activeIndex} onChange={setActiveIndex} />
    </div>
  );
}
