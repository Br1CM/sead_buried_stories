import { getClimateSeries, getClimateSpeciesIndex, getClimateSpeciesSeries } from "@/lib/data";
import { ClimateSpeciesFilter } from "@/components/ClimateSpeciesFilter";
import type { ClimatePoint } from "@/lib/types";
import { DatingNote } from "@/components/DatingNote";

export const metadata = { title: "The Ancient Thermometer | Buried Stories" };

export default function ClimatePage() {
  const series = getClimateSeries();
  const speciesIndex = getClimateSpeciesIndex();
  const speciesSeries = Object.fromEntries(
    speciesIndex.map((s) => [s.taxon_id, getClimateSpeciesSeries(s.taxon_id)])
  ) as Record<number, ClimatePoint[]>;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">The Ancient Thermometer</h1>
      <p className="mt-2 max-w-2xl text-ink-60">
        Beetles are picky: each species only survives within a narrow temperature range.
        So the mix of beetle species preserved in a dated layer brackets how warm that
        summer probably was &mdash; a thermometer built from dead insects. Hover the line
        to read a moment in time, or pick a single species below to see the record built
        just from the layers it turned up in.
      </p>
      <DatingNote kind="bp" />
      <div className="mt-8">
        <ClimateSpeciesFilter
          allSeries={series}
          speciesIndex={speciesIndex}
          speciesSeries={speciesSeries}
        />
      </div>
    </div>
  );
}
